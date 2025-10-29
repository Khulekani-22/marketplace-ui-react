/* eslint-disable react-refresh/only-export-components */
// src/components/shared/WalletComponents.tsx
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { useState, FormEvent } from "react";
import type { WalletRecord, WalletTransaction } from "../../context/WalletContext";

const numberFormatter = new Intl.NumberFormat("en-ZA");
const dateFormatter = new Intl.DateTimeFormat("en-ZA", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatCredits(value: number | undefined | null) {
  const amount = Number(value) || 0;
  return numberFormatter.format(Math.round(amount));
}

export function safeFormatDate(dateString: string | undefined | null) {
  if (!dateString) return "--";
  try {
    return dateFormatter.format(new Date(dateString));
  } catch {
    return "--";
  }
}

interface WalletSummaryCardProps {
  wallet: WalletRecord | null;
  loading?: boolean;
  eligible?: boolean;
  onRefresh?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

export function WalletSummaryCard({ 
  wallet, 
  loading = false, 
  eligible = true, 
  onRefresh, 
  showActions = true,
  compact = false 
}: WalletSummaryCardProps) {
  const balance = wallet?.balance ?? 0;
  const starting = wallet?.startingBalance ?? 0;
  const spent = Math.max(0, Math.round((starting - balance) * 100) / 100);
  const lastUpdatedLabel = wallet?.lastUpdated
    ? safeFormatDate(wallet.lastUpdated)
    : "--";

  return (
    <div className={`card ${compact ? 'p-16' : 'p-24'} radius-12 h-100`}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="mb-0">
          <Icon icon="mdi:wallet-giftcard" className="text-xl text-primary-600 me-2" />
          Voucher Wallet
        </h5>
        {onRefresh && (
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh wallet"
          >
            <Icon icon="mdi:refresh" className={loading ? "spin" : ""} />
          </button>
        )}
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-secondary mt-2 mb-0">Loading wallet balance...</p>
        </div>
      )}

      {!loading && !eligible && (
        <div className="alert alert-warning mb-0">
          <Icon icon="mdi:shield-alert" className="me-2" />
          Wallet credits unlock once your profile is verified as a startup or vendor. 
          Reach out to programme support if you need activation.
        </div>
      )}

      {!loading && eligible && !wallet && (
        <div className="alert alert-danger mb-0">
          <Icon icon="mdi:alert-circle" className="me-2" />
          Could not load wallet details. Try refreshing or contact support.
        </div>
      )}

      {!loading && eligible && wallet && (
        <>
          <div className="bg-primary-50 p-16 radius-12 mb-3">
            <div className="row align-items-center">
              <div className="col">
                <span className="text-sm text-secondary-light d-block mb-1">Available Credits</span>
                <h3 className="mb-0 text-primary-600">R {formatCredits(balance)}</h3>
              </div>
              <div className="col-auto">
                <Icon icon="mdi:credit-card-check" className="text-3xl text-primary-600" />
              </div>
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-6">
              <WalletStatItem 
                icon="mdi:rocket-launch-outline"
                label="Initial Allocation"
                value={`R ${formatCredits(starting)}`}
              />
            </div>
            <div className="col-6">
              <WalletStatItem 
                icon="mdi:chart-line"
                label="Credits Used"
                value={`R ${formatCredits(spent)}`}
              />
            </div>
          </div>

          <div className="mb-3">
            <WalletStatItem 
              icon="mdi:clock-outline"
              label="Last Activity"
              value={lastUpdatedLabel}
            />
          </div>

          {showActions && (
            <div className="d-flex gap-2">
              <Link to="/wallet" className="btn btn-primary flex-fill">
                <Icon icon="mdi:eye" className="me-1" />
                View Details
              </Link>
              <Link to="/market1" className="btn btn-outline-primary flex-fill">
                <Icon icon="mdi:shopping" className="me-1" />
                Browse
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface WalletStatItemProps {
  icon: string;
  label: string;
  value: string;
}

function WalletStatItem({ icon, label, value }: WalletStatItemProps) {
  return (
    <div className="d-flex align-items-center p-2 bg-light rounded">
      <Icon icon={icon} className="text-lg text-secondary-light me-2" />
      <div className="flex-grow-1 min-width-0">
        <div className="text-xs text-secondary-light">{label}</div>
        <div className="text-sm fw-medium text-truncate">{value}</div>
      </div>
    </div>
  );
}

interface TransactionTableProps {
  transactions: WalletTransaction[];
  compact?: boolean;
}

export function TransactionTable({ transactions, compact = false }: TransactionTableProps) {
  if (!transactions?.length) {
    return (
      <div className="text-center py-4">
        <Icon icon="mdi:receipt-text-outline" className="text-4xl text-secondary-light mb-2" />
        <p className="text-secondary-light mb-0">
          No voucher activity yet. Purchases using the marketplace will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover mb-0">
        <thead className="table-light">
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Description</th>
            {!compact && <th scope="col">Type</th>}
            <th scope="col" className="text-end">Amount</th>
            <th scope="col" className="text-end">Balance</th>
          </tr>
        </thead>
        <tbody>
          {transactions.slice(0, compact ? 5 : undefined).map((transaction) => (
            <tr key={transaction.id}>
              <td>
                <span className="text-sm">
                  {safeFormatDate(transaction.createdAt)}
                </span>
              </td>
              <td>
                <span className="text-sm">{transaction.description}</span>
                {transaction.reference && (
                  <div className="text-xs text-secondary-light">
                    Ref: {transaction.reference}
                  </div>
                )}
              </td>
              {!compact && (
                <td>
                  <TransactionTypeBadge type={transaction.type} />
                </td>
              )}
              <td className="text-end">
                <span className={`text-sm fw-medium ${
                  transaction.type === 'credit' ? 'text-success' : 'text-danger'
                }`}>
                  {transaction.type === 'credit' ? '+' : '-'}R {formatCredits(transaction.amount)}
                </span>
              </td>
              <td className="text-end">
                <span className="text-sm">R {formatCredits(transaction.balanceAfter)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {compact && transactions.length > 5 && (
        <div className="text-center pt-3">
          <Link to="/wallet" className="btn btn-outline-secondary btn-sm">
            View All Transactions ({transactions.length})
          </Link>
        </div>
      )}
    </div>
  );
}

interface TransactionTypeBadgeProps {
  type: string;
}

function TransactionTypeBadge({ type }: TransactionTypeBadgeProps) {
  const config = {
    credit: { icon: 'mdi:plus-circle', class: 'bg-success', label: 'Credit' },
    debit: { icon: 'mdi:minus-circle', class: 'bg-danger', label: 'Debit' },
    adjustment: { icon: 'mdi:circle-edit-outline', class: 'bg-warning', label: 'Adjustment' }
  };
  
  const { icon, class: badgeClass, label } = config[type as keyof typeof config] || 
    { icon: 'mdi:help-circle', class: 'bg-secondary', label: type };

  return (
    <span className={`badge ${badgeClass} d-flex align-items-center gap-1`}>
      <Icon icon={icon} className="text-xs" />
      {label}
    </span>
  );
}

interface QuickActionsProps {
  // eslint-disable-next-line no-unused-vars
  onRedeemCredits?: (input: { amount: number; note: string }) => Promise<void>;
  processing?: boolean;
}

export function QuickActions({ onRedeemCredits, processing = false }: QuickActionsProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!onRedeemCredits) return;

    const parsedAmount = Number(amount.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;

  await onRedeemCredits({ amount: parsedAmount, note });
    setAmount("");
    setNote("");
  };

  return (
    <div className="card p-16 radius-12">
      <h6 className="mb-3">
        <Icon icon="mdi:lightning-bolt" className="me-2" />
        Quick Actions
      </h6>
      
      <div className="row g-2 mb-3">
        <div className="col">
          <Link to="/market1" className="btn btn-outline-primary btn-sm w-100">
            <Icon icon="mdi:shopping" className="me-1" />
            Browse Marketplace
          </Link>
        </div>
        <div className="col">
          <Link to="/wallet" className="btn btn-outline-secondary btn-sm w-100">
            <Icon icon="mdi:wallet" className="me-1" />
            Full Wallet
          </Link>
        </div>
      </div>

      {onRedeemCredits && (
        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <label className="form-label text-sm">Record voucher usage</label>
            <div className="input-group input-group-sm">
              <span className="input-group-text">R</span>
              <input
                type="text"
                className="form-control"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                disabled={processing}
              />
            </div>
          </div>
          <div className="mb-2">
            <input
              type="text"
              className="form-control form-control-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Description (optional)"
              disabled={processing}
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary btn-sm w-100"
            disabled={processing || !amount}
          >
            {processing ? "Processing..." : "Record Usage"}
          </button>
        </form>
      )}
    </div>
  );
}
