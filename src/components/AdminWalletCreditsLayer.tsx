// src/components/AdminWalletCreditsLayerNew.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { Icon } from "@iconify/react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { Link } from "react-router-dom";
import { api, bootstrapSession } from "../lib/api";
import { toast } from "react-toastify";
import { useWallet } from "../hook/useWalletAxios";
import { useAppSync } from "../context/useAppSync";
import { WalletSummaryCard, TransactionTable, formatCredits } from "./shared/WalletComponents";
import AdminWalletManager from "./shared/AdminWalletManager";
import WalletNavigation from "./shared/WalletNavigation";

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

interface WalletTransaction {
  id: string;
  userId: string;
  userEmail: string;
  type: "credit" | "debit" | "adjustment";
  amount: number;
  description: string;
  adminEmail?: string;
  createdAt: string;
}

export default function AdminWalletCreditsLayer() {
  // State for admin voucher/sponsorship modals
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherUser, setVoucherUser] = useState<User | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState("");
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [sponsorUser, setSponsorUser] = useState<User | null>(null);
  const [sponsorGroup, setSponsorGroup] = useState("");
  const [sponsorLoading, setSponsorLoading] = useState(false);
  const [sponsorError, setSponsorError] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [syncing, setSyncing] = useState(false);
  
  // Platform users search (real Firebase users)
  const [allQuery, setAllQuery] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [allBusy, setAllBusy] = useState(false);
  const [allErr, setAllErr] = useState("");
  const [allNext, setAllNext] = useState("");
  const [allPageSize, setAllPageSize] = useState(100);
  const autoLoadedRef = useRef(false);
  
  // Wallet context for admin tools
  const { wallet: currentUserWallet, loading: walletLoading, eligible: walletEligible, refresh: refreshWallet, grantCredits } = useWallet();
  const { isAdmin } = useAppSync();

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

  // Auto-load platform users on mount
  useEffect(() => {
    if (autoLoadedRef.current) return;
    autoLoadedRef.current = true;
    let alive = true;
    (async () => {
      try {
        await bootstrapSession();
        if (!alive) return;
        await searchAllUsers(true);
        if (!alive) return;
        await loadData();
      } catch (error) {
        console.error("Failed to auto-load users:", error);
      }
    })();
    return () => { alive = false; };
  }, [searchAllUsers]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/users");
      const userData = response.data || [];
      
      // Transform the data to include wallet balance
      const usersWithWallets = userData.map((user: any) => ({
        ...user,
        walletBalance: getUserWalletBalance(user.uid || user.email),
        lastActivity: user.lastActivity || new Date().toISOString(),
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=6366f1&color=fff`
      }));
      
      setUsers(usersWithWallets);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const getUserWalletBalance = (userId: string): number => {
    // Since users now include walletBalance, we can get it directly
    const user = users.find((u: any) => u.uid === userId);
    return user?.walletBalance || 0;
  };

  // Handle admin data sync operations
  const handleNormalizeData = async () => {
    if (syncing) return;
    
    try {
      setSyncing(true);
      await api.post("/api/admin/wallet/normalize-appdata");
      toast.success("Successfully normalized app data");
      await loadData();
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
      await loadData();
    } catch (error: any) {
      console.error("Error syncing Firebase users:", error);
      const errorMessage = error.response?.data?.message || "Failed to sync Firebase users";
      toast.error(errorMessage);
    } finally {
      setSyncing(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAllUsers = allUsers.filter((user: any) =>
    user.email?.toLowerCase().includes(allQuery.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(allQuery.toLowerCase())
  );

  return (
    <div className="container-fluid">
      {/* Integration Notice */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="alert alert-info">
            <div className="d-flex align-items-center">
              <Icon icon="mdi:information" className="me-2 text-xl" />
              <div>
                <strong>Enhanced Integration Available:</strong> 
                <p className="mb-1">The main <Link to="/wallet" className="alert-link">Wallet interface</Link> now includes all admin functionality with improved user transaction tracking capabilities.</p>
                <small className="text-muted">This legacy interface remains available for compatibility, but we recommend using the unified wallet for better user experience.</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row gy-4">
        {/* Navigation */}
        <div className="col-12">
          <WalletNavigation />
        </div>

        {/* Current Admin User Wallet Summary */}
        {isAdmin && currentUserWallet && (
          <div className="col-12">
            <div className="row gy-4">
              <div className="col-12 col-lg-8">
                <WalletSummaryCard
                  wallet={currentUserWallet}
                  loading={walletLoading}
                  eligible={walletEligible}
                  onRefresh={refreshWallet}
                  showActions={true}
                />
              </div>
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
                    <Link to="/wallet" className="btn btn-outline-success btn-sm">
                      <Icon icon="mdi:wallet" className="me-2" />
                      Unified Wallet Interface
                    </Link>
                    <Link to="/dashboard" className="btn btn-outline-info btn-sm">
                      <Icon icon="mdi:view-dashboard" className="me-2" />
                      Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Credit Management Tools */}
        <div className="col-12">
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
            onRefresh={async () => {
              await loadData();
              await refreshWallet();
            }}
            compact={false}
            showUserLookup={true}
          />
        </div>

        {/* Current Admin User Recent Transactions */}
        {currentUserWallet?.transactions && currentUserWallet.transactions.length > 0 && (
          <div className="col-12">
            <div className="card p-24 radius-12">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="mb-0">
                  <Icon icon="mdi:history" className="text-xl text-primary-600 me-2" />
                  My Recent Activity
                </h5>
                <Link to="/wallet" className="btn btn-outline-primary btn-sm">
                  View Full History
                </Link>
              </div>
              <TransactionTable 
                transactions={currentUserWallet.transactions} 
                compact={true}
              />
            </div>
          </div>
        )}

        {/* Platform Users Management */}
        <div className="col-12">
          <div className="card p-24 radius-12">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="mb-0">
                <Icon icon="mdi:account-group" className="text-xl text-primary-600 me-2" />
                Platform Users
              </h5>
              <div className="d-flex gap-2">
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
                    placeholder="Search platform users..."
                    value={allQuery}
                    onChange={(e) => setAllQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {allErr && (
              <div className="alert alert-warning mb-3">
                <Icon icon="mdi:alert-circle" className="me-2" />
                {allErr}
              </div>
            )}

            {allBusy && (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-secondary mt-2">Searching platform users...</p>
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
                                const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
                                if (emailInput) {
                                  emailInput.value = user.email;
                                  emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                                }
                              }}
                              title="Grant credits to this user"
                            >
                              <Icon icon="mdi:wallet-plus" />
                            </button>
                            <button
                              className="btn btn-outline-success"
                              onClick={() => {
                                setVoucherUser(user);
                                setShowVoucherModal(true);
                              }}
                              title="Apply voucher for this user"
                            >
                              <Icon icon="mdi:ticket-percent" />
                            </button>
                            <button
                              className="btn btn-outline-warning"
                              onClick={() => {
                                setSponsorUser(user);
                                setShowSponsorModal(true);
                              }}
                              title="Apply sponsorship for this user"
                            >
                              <Icon icon="mdi:account-group" />
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

        {/* Local Users Management */}
        <div className="col-12">
          <div className="card p-24 radius-12">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="mb-0">
                <Icon icon="mdi:account-group" className="text-xl text-primary-600 me-2" />
                Local Users & Wallets
              </h5>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={loadData}
                disabled={loading}
              >
                {loading ? (
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
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {loading ? (
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
                                const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
                                if (emailInput) {
                                  emailInput.value = user.email;
                                  emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                                }
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
      </div>
    {/* Voucher Modal */}
    <Modal show={showVoucherModal} onHide={() => setShowVoucherModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Apply Voucher for {voucherUser ? (voucherUser.name || voucherUser.email) : "User"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <label className="form-label">Voucher Code</label>
          <input
            type="text"
            className="form-control"
            value={voucherCode}
            onChange={e => setVoucherCode(e.target.value)}
            placeholder="Enter voucher code"
          />
        </div>
        {voucherError && <div className="alert alert-danger py-2">{voucherError}</div>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowVoucherModal(false)}>Cancel</Button>
        <Button
          variant="success"
          disabled={voucherLoading || !voucherCode}
          onClick={async () => {
            setVoucherLoading(true);
            setVoucherError("");
            try {
              const res = await api.post("/api/admin/apply-voucher", {
                userId: voucherUser?.uid,
                voucherCode
              });
              toast.success("Voucher applied successfully");
              setShowVoucherModal(false);
              setVoucherCode("");
              await loadData();
            } catch (err) {
              setVoucherError((err as any)?.response?.data?.message || (err as any)?.message || "Failed to apply voucher");
            } finally {
              setVoucherLoading(false);
            }
          }}
        >
          {voucherLoading ? "Applying..." : "Apply Voucher"}
        </Button>
      </Modal.Footer>
    </Modal>

    {/* Sponsorship Modal */}
    <Modal show={showSponsorModal} onHide={() => setShowSponsorModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Apply Sponsorship for {sponsorUser ? (sponsorUser.name || sponsorUser.email) : "User"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <label className="form-label">Sponsorship Group</label>
          <input
            type="text"
            className="form-control"
            value={sponsorGroup}
            onChange={e => setSponsorGroup(e.target.value)}
            placeholder="Enter sponsorship group name"
          />
        </div>
        {sponsorError && <div className="alert alert-danger py-2">{sponsorError}</div>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowSponsorModal(false)}>Cancel</Button>
        <Button
          variant="warning"
          disabled={sponsorLoading || !sponsorGroup}
          onClick={async () => {
            setSponsorLoading(true);
            setSponsorError("");
            try {
              const res = await api.post("/api/admin/apply-sponsorship", {
                userId: sponsorUser?.uid,
                group: sponsorGroup
              });
              toast.success("Sponsorship applied successfully");
              setShowSponsorModal(false);
              setSponsorGroup("");
              await loadData();
            } catch (err) {
              setSponsorError((err as any)?.response?.data?.message || (err as any)?.message || "Failed to apply sponsorship");
            } finally {
              setSponsorLoading(false);
            }
          }}
        >
          {sponsorLoading ? "Applying..." : "Apply Sponsorship"}
        </Button>
      </Modal.Footer>
    </Modal>
  </div>
  );
}
