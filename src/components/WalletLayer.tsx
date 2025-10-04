import { Icon } from "@iconify/react/dist/iconify.js";
import { useState, useCallback, useEffect, useRef, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useWallet } from "../context/useWallet";
import { useAppSync } from "../context/useAppSync";
import { WalletSummaryCard, TransactionTable, formatCredits } from "./shared/WalletComponents";
import AdminWalletManager from "./shared/AdminWalletManager";
import WalletNavigation from "./shared/WalletNavigation";
import { api, bootstrapSession } from "../lib/api";

interface User {
  uid: string;
  id?: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  walletBalance: number;
  lastActivity: string;
  avatar: string;
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

  // Admin features - User Management
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserWallet, setSelectedUserWallet] = useState<any>(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [grantCreditsUserEmail, setGrantCreditsUserEmail] = useState("");
  const [syncing, setSyncing] = useState(false);
  
  // Platform users search (real Firebase users)
  const [allQuery, setAllQuery] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [allBusy, setAllBusy] = useState(false);
  const [allErr, setAllErr] = useState("");
  const [allNext, setAllNext] = useState("");
  const [allPageSize, setAllPageSize] = useState(50);
  const autoLoadedRef = useRef(false);

  // Platform transaction history
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [transactionFilters, setTransactionFilters] = useState({
    userEmail: "",
    type: "",
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: ""
  });
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsPerPage] = useState(20);
  const [showTransactionHistory, setShowTransactionHistory] = useState(true);

  // Search real Firebase users (like UserRoleManagement does)
  const searchAllUsers = useCallback(
    async (reset = true) => {
      setAllErr("");
      setAllBusy(true);
      try {
        const params: any = { search: allQuery, pageSize: allPageSize };
        if (!reset && allNext) params.pageToken = allNext;
        const { data } = await api.get("/api/users/all", { params });
        const items = Array.isArray(data?.items) ? data.items : [];
        setAllUsers((prev) => (reset ? items : [...prev, ...items]));
        setAllNext(data?.nextPageToken || "");
      } catch (e: any) {
        const status = e?.response?.status;
        if (status === 401 || status === 403) {
          try {
            await bootstrapSession();
            const params: any = { search: allQuery, pageSize: allPageSize };
            if (!reset && allNext) params.pageToken = allNext;
            const { data } = await api.get("/api/users/all", { params });
            const items = Array.isArray(data?.items) ? data.items : [];
            setAllUsers((prev) => (reset ? items : [...prev, ...items]));
            setAllNext(data?.nextPageToken || "");
            setAllErr("");
            return;
          } catch (e2: any) {
            setAllErr(e2?.response?.data?.message || e2?.message || "Failed to search platform users");
          }
        } else {
          setAllErr(e?.response?.data?.message || e?.message || "Failed to search platform users");
        }
      } finally {
        setAllBusy(false);
      }
    },
    [allQuery, allPageSize, allNext]
  );

  // Load local users for admin
  const loadLocalUsers = useCallback(async () => {
    if (!isAdmin) return;
    
    try {
      setUsersLoading(true);
      const response = await api.get("/api/users");
      const userData = response.data || [];
      
      // Transform the data to include wallet balance
      const usersWithWallets = userData.map((user: any) => ({
        ...user,
        walletBalance: user.walletBalance || 0,
        lastActivity: user.lastActivity || new Date().toISOString(),
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=6366f1&color=fff`
      }));
      
      setUsers(usersWithWallets);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load user data");
    } finally {
      setUsersLoading(false);
    }
  }, [isAdmin]);

  // Lookup specific user wallet
  const lookupUserWallet = useCallback(async (email: string) => {
    try {
      const { data } = await api.get("/api/wallets/admin/lookup", {
        params: { email: email.trim().toLowerCase() }
      });
      setSelectedUserWallet(data?.wallet || null);
      setSelectedUserEmail(email);
    } catch (error) {
      console.error("Error looking up user wallet:", error);
      setSelectedUserWallet(null);
      toast.error("Failed to lookup user wallet");
    }
  }, []);

  // Load all platform transactions for admin view
  const loadAllTransactions = useCallback(async () => {
    if (!isAdmin) return;
    
    try {
      setTransactionsLoading(true);
      console.log("Loading transactions with filters:", transactionFilters);
      
      // First ensure we have a valid session
      await bootstrapSession();
      
      try {
        // Try the dedicated transactions endpoint first
        const { data } = await api.get("/api/wallets/admin/transactions", {
          params: {
            userEmail: transactionFilters.userEmail || undefined,
            type: transactionFilters.type || undefined,
            dateFrom: transactionFilters.dateFrom || undefined,
            dateTo: transactionFilters.dateTo || undefined,
            minAmount: transactionFilters.minAmount || undefined,
            maxAmount: transactionFilters.maxAmount || undefined,
            page: transactionsPage,
            limit: transactionsPerPage
          }
        });
        
        console.log("Received transaction data from dedicated endpoint:", data);
        setAllTransactions(data?.transactions || []);
        
        if (data?.transactions?.length > 0) {
          toast.success(`Loaded ${data.transactions.length} transactions`);
        } else {
          toast.info("No transactions found");
        }
      } catch (endpointError: any) {
        console.warn("Dedicated transactions endpoint failed, trying fallback approach:", endpointError);
        
        // Fallback: Get all wallets and extract transactions manually
        const { data: walletsData } = await api.get("/api/wallets", {
          suppressToast: true,
          suppressErrorLog: true
        } as any);
        
        console.log("Received wallets data for transaction extraction:", walletsData);
        
        // Extract transactions from all wallets
        let allTransactions: any[] = [];
        
        if (Array.isArray(walletsData)) {
          walletsData.forEach((wallet: any) => {
            if (wallet && wallet.transactions && Array.isArray(wallet.transactions)) {
              wallet.transactions.forEach((transaction: any) => {
                allTransactions.push({
                  ...transaction,
                  userEmail: wallet.userEmail || wallet.email || 'Unknown',
                  userName: wallet.userName || wallet.name,
                  userRole: wallet.role,
                  userTenant: wallet.tenantId,
                  walletBalance: wallet.balance
                });
              });
            }
          });
        }
        
        // Apply client-side filtering
        let filteredTransactions = allTransactions;
        
        if (transactionFilters.userEmail) {
          const normalizedEmail = transactionFilters.userEmail.toLowerCase();
          filteredTransactions = filteredTransactions.filter(t => 
            t.userEmail.toLowerCase().includes(normalizedEmail)
          );
        }
        
        if (transactionFilters.type) {
          filteredTransactions = filteredTransactions.filter(t => t.type === transactionFilters.type);
        }
        
        if (transactionFilters.dateFrom) {
          const fromDate = new Date(transactionFilters.dateFrom);
          filteredTransactions = filteredTransactions.filter(t => 
            new Date(t.createdAt) >= fromDate
          );
        }
        
        if (transactionFilters.dateTo) {
          const toDate = new Date(transactionFilters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          filteredTransactions = filteredTransactions.filter(t => 
            new Date(t.createdAt) <= toDate
          );
        }
        
        if (transactionFilters.minAmount) {
          const min = Number(transactionFilters.minAmount);
          if (Number.isFinite(min)) {
            filteredTransactions = filteredTransactions.filter(t => t.amount >= min);
          }
        }
        
        if (transactionFilters.maxAmount) {
          const max = Number(transactionFilters.maxAmount);
          if (Number.isFinite(max)) {
            filteredTransactions = filteredTransactions.filter(t => t.amount <= max);
          }
        }
        
        // Sort by creation date (newest first)
        filteredTransactions.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        console.log("Extracted and filtered transactions:", filteredTransactions);
        setAllTransactions(filteredTransactions);
        
        if (filteredTransactions.length > 0) {
          toast.success(`Loaded ${filteredTransactions.length} transactions (fallback method)`);
        } else {
          toast.info("No transactions found in any wallets");
        }
      }
    } catch (error: any) {
      console.error("Error loading transactions:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to load transaction history";
      const statusCode = error.response?.status;
      
      if (statusCode === 404) {
        toast.error("Transaction endpoint not found. Please check if backend is running with latest code.");
      } else if (statusCode === 401 || statusCode === 403) {
        toast.error("Authentication required. Please sign in again.");
      } else {
        toast.error(`Failed to load transaction history: ${errorMessage}`);
      }
      
      setAllTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  }, [isAdmin, transactionFilters, transactionsPage, transactionsPerPage]);

  // Reset transaction filters
  const resetTransactionFilters = useCallback(() => {
    setTransactionFilters({
      userEmail: "",
      type: "",
      dateFrom: "",
      dateTo: "",
      minAmount: "",
      maxAmount: ""
    });
    setTransactionsPage(1);
  }, []);

  // Apply transaction filters
  const applyTransactionFilters = useCallback(() => {
    setTransactionsPage(1);
    loadAllTransactions();
  }, [loadAllTransactions]);

  // Handle admin data sync operations
  const handleNormalizeData = async () => {
    if (syncing) return;
    
    try {
      setSyncing(true);
      await api.post("/api/admin/wallet/normalize-appdata");
      toast.success("Successfully normalized app data");
      await loadLocalUsers();
      await refresh();
    } catch (error: any) {
      console.error("Error normalizing data:", error);
      const errorMessage = error.response?.data?.message || "Failed to normalize app data";
      toast.error(errorMessage);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncFirebaseUsers = async () => {
    if (syncing) return;
    
    try {
      setSyncing(true);
      const promoteVendors = [
        "mncubekhulekani@gmail.com",
        "ruthmaphosa2024@gmail.com", 
        "zinhlesloane@gmail.com",
        "khulekani@gecafrica.co",
        "22onsloanedigitalteam@gmail.com",
        "khulekani@22onsloane.co"
      ];
      
      const response = await api.post("/api/admin/wallet/sync-firebase-users", {
        promoteVendors,
        defaultRole: "member",
        defaultTenant: "vendor"
      });
      
      toast.success(`Successfully synced ${response.data.synced} Firebase users`);
      await loadLocalUsers();
    } catch (error: any) {
      console.error("Error syncing Firebase users:", error);
      const errorMessage = error.response?.data?.message || "Failed to sync Firebase users";
      toast.error(errorMessage);
    } finally {
      setSyncing(false);
    }
  };

  // Auto-load platform users on mount for admins
  useEffect(() => {
    if (!isAdmin || autoLoadedRef.current) return;
    autoLoadedRef.current = true;
    let alive = true;
    (async () => {
      try {
        await bootstrapSession();
        if (!alive) return;
        await searchAllUsers(true);
        if (!alive) return;
        await loadLocalUsers();
      } catch (error) {
        console.error("Failed to auto-load users:", error);
      }
    })();
    return () => { alive = false; };
  }, [isAdmin, searchAllUsers, loadLocalUsers]);

  // Auto-load transaction history when shown
  useEffect(() => {
    if (isAdmin && showTransactionHistory && allTransactions.length === 0) {
      loadAllTransactions();
    }
  }, [isAdmin, showTransactionHistory, loadAllTransactions, allTransactions.length]);

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

  // Filter functions for admin user management
  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAllUsers = allUsers.filter((user: any) =>
    user.email?.toLowerCase().includes(allQuery.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(allQuery.toLowerCase())
  );

  // Paginated transactions for display
  const paginatedTransactions = allTransactions.slice(
    (transactionsPage - 1) * transactionsPerPage,
    transactionsPage * transactionsPerPage
  );

  const totalTransactionPages = Math.ceil(allTransactions.length / transactionsPerPage);

  return (
    <div className='row gy-4'>
      {/* Navigation - Enhanced for admin */}
      {isAdmin && (
        <div className="col-12">
          <WalletNavigation />
        </div>
      )}
      
      {/* Wallet Summary */}
      <div className={isAdmin ? 'col-12 col-lg-8' : 'col-12 col-lg-8'}>
        <WalletSummaryCard
          wallet={wallet}
          loading={loading}
          eligible={eligible}
          onRefresh={refresh}
          showActions={!isAdmin}
        />
      </div>

      {/* Admin Quick Actions Panel */}
      {isAdmin && (
        <div className="col-12 col-lg-4">
          <div className="card p-24 radius-12 h-100">
            <h5 className="mb-3">
              <Icon icon="mdi:shield-crown" className="text-xl text-primary-600 me-2" />
              Admin Actions
            </h5>
            <div className="d-grid gap-2">
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={handleNormalizeData}
                disabled={syncing}
              >
                {syncing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Normalizing...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:database-sync" className="me-2" />
                    Normalize Data
                  </>
                )}
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={handleSyncFirebaseUsers}
                disabled={syncing}
              >
                {syncing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Syncing...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:account-sync" className="me-2" />
                    Sync Firebase Users
                  </>
                )}
              </button>
              <Link to="/admin/wallet-credits" className="btn btn-outline-warning btn-sm">
                <Icon icon="mdi:wallet-plus" className="me-2" />
                Legacy Admin
              </Link>
              <Link to="/dashboard" className="btn btn-outline-info btn-sm">
                <Icon icon="mdi:view-dashboard" className="me-2" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Manual Transaction Entry - Regular users only or compact for admin */}
      {(!isAdmin || wallet) && (
        <div className={isAdmin ? 'col-12 col-lg-6' : 'col-12 col-lg-4'}>
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
      )}

      {/* Selected User Wallet Details - Admin only */}
      {isAdmin && selectedUserWallet && (
        <div className="col-12 col-lg-6">
          <div className="card p-24 radius-12">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="mb-0">
                <Icon icon="mdi:account-cash" className="text-xl text-primary-600 me-2" />
                User Wallet: {selectedUserEmail}
              </h5>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setSelectedUserWallet(null);
                  setSelectedUserEmail("");
                }}
              >
                <Icon icon="mdi:close" />
              </button>
            </div>
            <WalletSummaryCard
              wallet={selectedUserWallet}
              loading={false}
              eligible={true}
              onRefresh={() => lookupUserWallet(selectedUserEmail)}
              showActions={false}
              compact={true}
            />
            {selectedUserWallet.transactions && selectedUserWallet.transactions.length > 0 && (
              <div className="mt-3">
                <h6 className="mb-2">Recent Transactions</h6>
                <TransactionTable 
                  transactions={selectedUserWallet.transactions.slice(0, 5)} 
                  compact={true}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transaction History */}
      {wallet && (
        <div className='col-12'>
          <div className='card p-24 radius-12'>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className='mb-0'>
                <Icon icon='mdi:history' className='text-xl text-primary-600 me-2' />
                {isAdmin ? 'My Transaction History' : 'Transaction History'}
              </h5>
              {isAdmin && (
                <div className="text-sm text-secondary">
                  Total Transactions: {wallet.transactions?.length || 0}
                </div>
              )}
            </div>
            <TransactionTable transactions={wallet.transactions || []} />
          </div>
        </div>
      )}

      {/* Admin Credit Management Tools */}
      {isAdmin && (
        <div className='col-12'>
          <AdminWalletManager
            grantCredits={grantCredits}
            onRefresh={async () => {
              await loadLocalUsers();
              await refresh();
            }}
            compact={false}
            showUserLookup={true}
            selectedUserEmail={grantCreditsUserEmail}
            onEmailChange={setGrantCreditsUserEmail}
          />
        </div>
      )}

      {/* Platform Users Management - Admin only */}
      {isAdmin && (
        <div className="col-12">
          <div className="card p-24 radius-12">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="mb-0">
                <Icon icon="mdi:account-group" className="text-xl text-primary-600 me-2" />
                Platform Users Transaction Tracking
              </h5>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => {
                    const newShowState = !showTransactionHistory;
                    setShowTransactionHistory(newShowState);
                    // Auto-load transactions when showing for the first time
                    if (newShowState && allTransactions.length === 0) {
                      loadAllTransactions();
                    }
                  }}
                >
                  <Icon icon="mdi:history" className="me-1" />
                  {showTransactionHistory ? 'Hide' : 'Show'} Transaction History
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => searchAllUsers(true)}
                  disabled={allBusy}
                >
                  {allBusy ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    <Icon icon="mdi:refresh" />
                  )}
                </button>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-12 col-md-6">
                <div className="input-group">
                  <span className="input-group-text">
                    <Icon icon="mdi:magnify" />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search platform users by name or email..."
                    value={allQuery}
                    onChange={(e) => setAllQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-12 col-md-6">
                <button
                  className="btn btn-primary w-100"
                  onClick={() => searchAllUsers(true)}
                  disabled={allBusy}
                >
                  {allBusy ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Searching...
                    </>
                  ) : (
                    <>
                      <Icon icon="mdi:magnify" className="me-2" />
                      Search Users
                    </>
                  )}
                </button>
              </div>
            </div>

            {allErr && (
              <div className="alert alert-warning mb-3">
                <Icon icon="mdi:alert-circle" className="me-2" />
                {allErr}
              </div>
            )}

            {!allBusy && filteredAllUsers.length > 0 && (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Last Sign In</th>
                      <th>Provider</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAllUsers.slice(0, 20).map((user: any) => (
                      <tr key={user.uid}>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=6366f1&color=fff`}
                              alt={user.displayName || user.email}
                              className="rounded-circle me-2"
                              width="32"
                              height="32"
                            />
                            <div>
                              <div className="fw-medium">{user.displayName || 'No Name'}</div>
                              <div className="text-xs text-secondary">{user.uid}</div>
                            </div>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span className="text-sm">
                            {user.metadata?.lastSignInTime ? 
                              new Date(user.metadata.lastSignInTime).toLocaleDateString() : 
                              'Never'
                            }
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark">
                            {user.providerData?.[0]?.providerId || 'Unknown'}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => {
                                // Auto-fill grant credits form
                                setGrantCreditsUserEmail(user.email);
                              }}
                              title="Grant credits to this user"
                            >
                              <Icon icon="mdi:wallet-plus" />
                            </button>
                            <button
                              className="btn btn-outline-info"
                              onClick={() => lookupUserWallet(user.email)}
                              title="View user's transaction history"
                            >
                              <Icon icon="mdi:history" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredAllUsers.length > 20 && (
                  <div className="text-center pt-3">
                    <small className="text-secondary">
                      Showing 20 of {filteredAllUsers.length} users. Use search to narrow results.
                    </small>
                  </div>
                )}
              </div>
            )}

            {!allBusy && filteredAllUsers.length === 0 && allQuery && (
              <div className="text-center py-4">
                <Icon icon="mdi:account-search" className="text-4xl text-secondary-light mb-2" />
                <p className="text-secondary">No users found matching "{allQuery}"</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Platform Users Transaction History - Admin only */}
      {isAdmin && showTransactionHistory && (
        <div className="col-12">
          <div className="card p-24 radius-12">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="mb-0">
                <Icon icon="mdi:chart-line" className="text-xl text-primary-600 me-2" />
                Platform Transaction History
              </h5>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={loadAllTransactions}
                  disabled={transactionsLoading}
                >
                  {transactionsLoading ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    <Icon icon="mdi:refresh" />
                  )}
                </button>
                <button
                  className="btn btn-outline-success btn-sm"
                  onClick={async () => {
                    try {
                      console.log("Testing basic wallets endpoints...");
                      await bootstrapSession();
                      
                      // Test basic wallets endpoint
                      const walletsResponse = await api.get("/api/wallets");
                      console.log("Wallets endpoint works:", walletsResponse.data);
                      
                      // Test debug endpoint
                      const debugResponse = await api.get("/api/wallets/admin/debug/wallets");
                      console.log("Debug endpoint works:", debugResponse.data);
                      
                      toast.success("Basic wallet endpoints work!");
                    } catch (error: any) {
                      console.error("Basic endpoints test failed:", error);
                      const statusCode = error.response?.status;
                      const errorMessage = error.response?.data?.message || error.message;
                      toast.error(`Basic endpoints failed (${statusCode}): ${errorMessage}`);
                    }
                  }}
                >
                  <Icon icon="mdi:check-circle" className="me-1" />
                  Test Basic
                </button>
                <button
                  className="btn btn-outline-warning btn-sm"
                  onClick={async () => {
                    try {
                      console.log("Testing transaction endpoint directly...");
                      console.log("Current API base URL:", api.defaults.baseURL);
                      
                      await bootstrapSession();
                      
                      const fullUrl = `${api.defaults.baseURL || ''}/api/wallets/admin/transactions`;
                      console.log("Full URL being called:", fullUrl);
                      
                      const response = await api.get("/api/wallets/admin/transactions", {
                        params: { limit: 10 }
                      });
                      
                      console.log("Transaction endpoint test response:", response);
                      toast.success(`Transaction endpoint works! Found ${response.data?.transactions?.length || 0} transactions`);
                    } catch (error: any) {
                      console.error("Transaction endpoint test failed:", error);
                      console.error("Request config:", error.config);
                      console.error("Request URL:", error.config?.url);
                      console.error("Full request details:", {
                        baseURL: error.config?.baseURL,
                        url: error.config?.url,
                        method: error.config?.method,
                        headers: error.config?.headers
                      });
                      
                      const statusCode = error.response?.status;
                      const errorMessage = error.response?.data?.message || error.message;
                      toast.error(`Transaction endpoint failed (${statusCode}): ${errorMessage}`);
                    }
                  }}
                >
                  <Icon icon="mdi:database-search" className="me-1" />
                  Test Transactions
                </button>
                <button
                  className="btn btn-outline-info btn-sm"
                  onClick={async () => {
                    try {
                      // First test basic connection
                      const healthResponse = await api.get("/api/health");
                      console.log("Health check:", healthResponse.data);
                      
                      // Test direct backend connection
                      const directHealthResponse = await fetch("http://localhost:5055/api/health");
                      const directHealth = await directHealthResponse.json();
                      console.log("Direct health check:", directHealth);
                      
                      // Then test authenticated endpoint
                      await bootstrapSession();
                      const debugResponse = await api.get("/api/wallets/admin/debug/wallets");
                      console.log("Debug response:", debugResponse.data);
                      
                      toast.success("Backend connection successful!");
                    } catch (error: any) {
                      console.error("Backend connection failed:", error);
                      const statusCode = error.response?.status;
                      const errorMessage = error.response?.data?.message || error.message;
                      
                      if (statusCode === 404) {
                        toast.error("Endpoint not found (404). Check backend routes.");
                      } else if (statusCode === 401 || statusCode === 403) {
                        toast.error("Authentication failed. Please sign in again.");
                      } else {
                        toast.error(`Backend connection failed: ${errorMessage}`);
                      }
                    }
                  }}
                >
                  <Icon icon="mdi:bug" className="me-1" />
                  Test Backend
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={resetTransactionFilters}
                >
                  <Icon icon="mdi:filter-off" className="me-1" />
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Transaction Filters */}
            <div className="row g-3 mb-4 p-3 bg-light rounded">
              <div className="col-12">
                <h6 className="mb-2">
                  <Icon icon="mdi:filter" className="me-1" />
                  Transaction Filters
                </h6>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <label className="form-label text-sm">User Email</label>
                <input
                  type="email"
                  className="form-control form-control-sm"
                  placeholder="Filter by user email..."
                  value={transactionFilters.userEmail}
                  onChange={(e) => setTransactionFilters(prev => ({ ...prev, userEmail: e.target.value }))}
                />
              </div>
              <div className="col-12 col-md-6 col-lg-2">
                <label className="form-label text-sm">Transaction Type</label>
                <select
                  className="form-select form-select-sm"
                  value={transactionFilters.type}
                  onChange={(e) => setTransactionFilters(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="">All Types</option>
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>
              <div className="col-12 col-md-6 col-lg-2">
                <label className="form-label text-sm">Date From</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={transactionFilters.dateFrom}
                  onChange={(e) => setTransactionFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>
              <div className="col-12 col-md-6 col-lg-2">
                <label className="form-label text-sm">Date To</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={transactionFilters.dateTo}
                  onChange={(e) => setTransactionFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>
              <div className="col-12 col-md-6 col-lg-1">
                <label className="form-label text-sm">Min Amount</label>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="0"
                  value={transactionFilters.minAmount}
                  onChange={(e) => setTransactionFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                />
              </div>
              <div className="col-12 col-md-6 col-lg-2">
                <label className="form-label text-sm">Max Amount</label>
                <div className="d-flex gap-1">
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="∞"
                    value={transactionFilters.maxAmount}
                    onChange={(e) => setTransactionFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={applyTransactionFilters}
                    disabled={transactionsLoading}
                  >
                    <Icon icon="mdi:magnify" />
                  </button>
                </div>
              </div>
            </div>

            {/* Transaction Summary Stats */}
            {allTransactions.length > 0 && (
              <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                  <div className="bg-primary-50 p-3 rounded text-center">
                    <div className="text-sm text-secondary">Total Transactions</div>
                    <div className="h5 text-primary mb-0">{allTransactions.length}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="bg-success-50 p-3 rounded text-center">
                    <div className="text-sm text-secondary">Total Credits</div>
                    <div className="h5 text-success mb-0">
                      R {formatCredits(allTransactions
                        .filter((t: any) => t.type === 'credit')
                        .reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="bg-danger-50 p-3 rounded text-center">
                    <div className="text-sm text-secondary">Total Debits</div>
                    <div className="h5 text-danger mb-0">
                      R {formatCredits(allTransactions
                        .filter((t: any) => t.type === 'debit')
                        .reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="bg-info-50 p-3 rounded text-center">
                    <div className="text-sm text-secondary">Unique Users</div>
                    <div className="h5 text-info mb-0">
                      {new Set(allTransactions.map((t: any) => t.userEmail)).size}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Table */}
            {transactionsLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-secondary mt-2">Loading transaction history...</p>
              </div>
            ) : allTransactions.length > 0 ? (
              <>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>User</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th className="text-end">Amount</th>
                        <th className="text-end">Balance After</th>
                        <th>Reference</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTransactions.map((transaction: any) => (
                        <tr key={transaction.id}>
                          <td>
                            <span className="text-sm">
                              {new Date(transaction.createdAt).toLocaleDateString()} 
                              <br />
                              <small className="text-muted">
                                {new Date(transaction.createdAt).toLocaleTimeString()}
                              </small>
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(transaction.userEmail || 'Unknown')}&background=6366f1&color=fff&size=24`}
                                alt={transaction.userEmail}
                                className="rounded-circle me-2"
                                width="24"
                                height="24"
                              />
                              <div>
                                <div className="text-sm fw-medium">{transaction.userEmail}</div>
                                {transaction.userName && (
                                  <small className="text-muted">{transaction.userName}</small>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${
                              transaction.type === 'credit' ? 'bg-success' : 
                              transaction.type === 'debit' ? 'bg-danger' : 'bg-warning'
                            }`}>
                              <Icon icon={
                                transaction.type === 'credit' ? 'mdi:plus-circle' : 
                                transaction.type === 'debit' ? 'mdi:minus-circle' : 'mdi:circle-edit-outline'
                              } className="me-1" />
                              {transaction.type}
                            </span>
                          </td>
                          <td>
                            <span className="text-sm">{transaction.description}</span>
                            {transaction.metadata && (
                              <div className="text-xs text-muted">
                                {transaction.metadata.source && `Source: ${transaction.metadata.source}`}
                                {transaction.metadata.note && ` | ${transaction.metadata.note}`}
                              </div>
                            )}
                          </td>
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
                          <td>
                            {transaction.reference && (
                              <small className="text-muted font-monospace">{transaction.reference}</small>
                            )}
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-info"
                                onClick={() => lookupUserWallet(transaction.userEmail)}
                                title="View user's full wallet"
                              >
                                <Icon icon="mdi:wallet" />
                              </button>
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => {
                                  setGrantCreditsUserEmail(transaction.userEmail);
                                }}
                                title="Grant credits to this user"
                              >
                                <Icon icon="mdi:wallet-plus" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalTransactionPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div className="text-sm text-secondary">
                      Showing {((transactionsPage - 1) * transactionsPerPage) + 1} to {Math.min(transactionsPage * transactionsPerPage, allTransactions.length)} of {allTransactions.length} transactions
                    </div>
                    <nav>
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${transactionsPage === 1 ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => setTransactionsPage(transactionsPage - 1)}
                            disabled={transactionsPage === 1}
                          >
                            <Icon icon="mdi:chevron-left" />
                          </button>
                        </li>
                        {Array.from({ length: Math.min(5, totalTransactionPages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(totalTransactionPages - 4, transactionsPage - 2)) + i;
                          return (
                            <li key={pageNum} className={`page-item ${pageNum === transactionsPage ? 'active' : ''}`}>
                              <button
                                className="page-link"
                                onClick={() => setTransactionsPage(pageNum)}
                              >
                                {pageNum}
                              </button>
                            </li>
                          );
                        })}
                        <li className={`page-item ${transactionsPage === totalTransactionPages ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => setTransactionsPage(transactionsPage + 1)}
                            disabled={transactionsPage === totalTransactionPages}
                          >
                            <Icon icon="mdi:chevron-right" />
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <Icon icon="mdi:chart-line-variant" className="text-4xl text-secondary-light mb-2" />
                <p className="text-secondary">
                  No transactions found matching the current filters.
                </p>
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={loadAllTransactions}
                >
                  <Icon icon="mdi:refresh" className="me-1" />
                  Load Transaction History
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Local Users & Wallets Management - Admin only */}
      {isAdmin && (
        <div className="col-12">
          <div className="card p-24 radius-12">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="mb-0">
                <Icon icon="mdi:account-group" className="text-xl text-primary-600 me-2" />
                Local Users & Wallets
              </h5>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={loadLocalUsers}
                disabled={usersLoading}
              >
                {usersLoading ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : (
                  <Icon icon="mdi:refresh" />
                )}
              </button>
            </div>

            <div className="row mb-3">
              <div className="col-12 col-md-6">
                <div className="input-group">
                  <span className="input-group-text">
                    <Icon icon="mdi:magnify" />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search local users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {usersLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-secondary mt-2">Loading users...</p>
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Tenant</th>
                      <th>Wallet Balance</th>
                      <th>Last Activity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.uid}>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="rounded-circle me-2"
                              width="32"
                              height="32"
                            />
                            <div>
                              <div className="fw-medium">{user.name}</div>
                              <div className="text-xs text-secondary">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${user.role === 'admin' ? 'bg-danger' : user.role === 'vendor' ? 'bg-warning' : 'bg-secondary'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>{user.tenantId}</td>
                        <td>
                          <span className="fw-medium">R {formatCredits(user.walletBalance)}</span>
                        </td>
                        <td>
                          <span className="text-sm">
                            {new Date(user.lastActivity).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => {
                                // Auto-fill grant credits form
                                setGrantCreditsUserEmail(user.email);
                              }}
                              title="Grant credits to this user"
                            >
                              <Icon icon="mdi:wallet-plus" />
                            </button>
                            <button
                              className="btn btn-outline-info"
                              onClick={() => lookupUserWallet(user.email)}
                              title="View user's transaction history"
                            >
                              <Icon icon="mdi:history" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4">
                <Icon icon="mdi:account-search" className="text-4xl text-secondary-light mb-2" />
                <p className="text-secondary">
                  {searchTerm ? `No users found matching "${searchTerm}"` : "No users found"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
