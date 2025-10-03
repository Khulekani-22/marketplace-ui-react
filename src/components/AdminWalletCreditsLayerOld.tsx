// src/components/AdminWalletCreditsLayer.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { Icon } from "@iconify/react";
import { api, bootstrapSession } from "../lib/api";
import { toast } from "react-toastify";

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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditDescription, setCreditDescription] = useState("");
  const [showAddCreditsModal, setShowAddCreditsModal] = useState(false);
  const [processingCredit, setProcessingCredit] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // Platform users search (real Firebase users)
  const [allQuery, setAllQuery] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [allBusy, setAllBusy] = useState(false);
  const [allErr, setAllErr] = useState("");
  const [allNext, setAllNext] = useState("");
  const [allPageSize, setAllPageSize] = useState(100);
  const autoLoadedRef = useRef(false);

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

  // Auto-load platform users on mount (same as pressing Refresh)
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
        console.error("Error in auto-load:", error);
        if (alive) {
          await loadData(); // fallback to basic load
        }
      }
    })();
    return () => { alive = false; };
  }, [searchAllUsers]);

  // Load combined data from Firebase users and wallet information
  const loadData = async () => {
    try {
      setLoading(true);

      console.log("Loading admin wallet data...");

      // Use backend/appData.json users combined with wallet info
      const { data } = await api.get("/api/admin/wallet/users");
      const list = Array.isArray(data?.users) ? data.users : [];

      // Filter for users eligible for wallet credits (matching wallet eligibility criteria)
      const ELIGIBLE_ROLES = new Set(["vendor", "member", "startup"]);
      const ELIGIBLE_TENANTS = new Set(["vendor", "basic", "startup"]);

      const eligibleUsers = list.filter((user: any) => {
        if (user.disabled) return false;
        const normalizedRole = (user.role || "").toString().trim().toLowerCase() || "member";
        const normalizedTenant = (user.tenantId || "").toString().trim().toLowerCase() || "vendor";
        return ELIGIBLE_ROLES.has(normalizedRole) || ELIGIBLE_TENANTS.has(normalizedTenant);
      });

      console.log("Eligible users (from appData):", eligibleUsers);
      setUsers(eligibleUsers);

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load user and wallet data");
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get wallet balance for a user
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

  // Handle adding credits
  const handleAddCredits = async () => {
    if (!selectedUser || !creditAmount || !creditDescription.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    try {
      setProcessingCredit(true);
      
      // Call API to add credits
      await api.post("/api/admin/wallet/add-credits", {
        userId: selectedUser.id || selectedUser.uid,
        userEmail: selectedUser.email,
        amount: amount,
        description: creditDescription.trim(),
        type: "admin_allocation"
      });

      toast.success(`Successfully added ${amount} credits to ${selectedUser.email}`);
      
      // Reset form and close modal
      setSelectedUser(null);
      setCreditAmount("");
      setCreditDescription("");
      setShowAddCreditsModal(false);
      
      // Reload data to reflect changes
      await loadData();

    } catch (error: any) {
      console.error("Error adding credits:", error);
      const errorMessage = error.response?.data?.message || "Failed to add credits";
      toast.error(errorMessage);
    } finally {
      setProcessingCredit(false);
    }
  };

  // Handle bulk credit allocation
  const handleBulkCredits = async () => {
    if (!creditAmount || !creditDescription.trim()) {
      toast.error("Please fill in amount and description for bulk allocation");
      return;
    }

    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    const confirmBulk = window.confirm(
      `Are you sure you want to add ${amount} credits to all ${filteredUsers.length} eligible users?`
    );

    if (!confirmBulk) return;

    try {
      setProcessingCredit(true);
      
      // Call API for bulk allocation
      await api.post("/api/admin/wallet/bulk-credits", {
        userIds: filteredUsers.map(u => u.id || u.uid),
        amount: amount,
        description: creditDescription.trim(),
        type: "bulk_admin_allocation"
      });

      toast.success(`Successfully added ${amount} credits to ${filteredUsers.length} users`);
      
      // Reset form
      setCreditAmount("");
      setCreditDescription("");
      
      // Reload data
      await loadData();

    } catch (error: any) {
      console.error("Error with bulk credits:", error);
      const errorMessage = error.response?.data?.message || "Failed to add bulk credits";
      toast.error(errorMessage);
    } finally {
      setProcessingCredit(false);
    }
  };

  if (loading) {
    return (
      <section className="py-4">
        <div className="container-xxl">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading wallet data...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="wallet-credits py-4 py-lg-5">
      <div className="container-xxl">
        {/* Stats KPIs */}
        <div className="row g-3 mb-4">
          {[{
            id: "total-users",
            label: "Eligible Users",
            value: users.length.toLocaleString(),
            delta: "",
            icon: "mdi:account-group",
          }, {
            id: "total-credits",
            label: "Total Credits Allocated",
            value: users.reduce((sum, user) => sum + (user.walletBalance || 0), 0).toFixed(2),
            delta: "",
            icon: "mdi:wallet",
          }, {
            id: "users-with-credits",
            label: "Users with Credits",
            value: users.filter(user => (user.walletBalance || 0) > 0).length.toLocaleString(),
            delta: "",
            icon: "mdi:account-cash",
          }, {
            id: "users-no-credits",
            label: "Users with No Credits",
            value: users.filter(user => (user.walletBalance || 0) === 0).length.toLocaleString(),
            delta: "",
            icon: "mdi:cash-remove",
          }].map((kpi) => (
            <div className="col-6 col-lg-3" key={kpi.id}>
              <div className="wallet-credits__kpi card h-100">
                <div className="card-body">
                  <div className="text-uppercase small text-secondary mb-2">{kpi.label}</div>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="h4 mb-0 fw-bold">{kpi.value}</div>
                    <Icon icon={kpi.icon} width={24} height={24} className="text-primary" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Actions */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h5 mb-0">Manage Credits</h2>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleNormalizeData}
                  disabled={syncing || loading}
                  title="Normalize app data for wallet integration"
                >
                  <Icon icon="mdi:database-sync" className="me-2" />
                  {syncing ? "Syncing..." : "Normalize Data"}
                </button>
                <button
                  className="btn btn-outline-info btn-sm"
                  onClick={handleSyncFirebaseUsers}
                  disabled={syncing || loading}
                  title="Sync Firebase users and promote vendors"
                >
                  <Icon icon="mdi:account-sync" className="me-2" />
                  {syncing ? "Syncing..." : "Sync Firebase"}
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => {
                    searchAllUsers(true);
                    loadData();
                  }}
                  disabled={loading || allBusy}
                  title="Refresh user data from Firebase"
                >
                  <Icon icon="mdi:refresh" className="me-2" />
                  {loading || allBusy ? "Refreshing..." : "Refresh"}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAddCreditsModal(true)}
                  disabled={processingCredit}
                >
                  <Icon icon="mdi:wallet-plus" className="me-2" />
                  Add Credits
                </button>
              </div>
            </div>
            
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label className="form-label small text-secondary text-uppercase">Search Users</label>
                <div className="input-group">
                  <span className="input-group-text border-end-0">
                    <Icon icon="ion:search-outline" width={18} height={18} />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search by email or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <label className="form-label small text-secondary text-uppercase">Bulk Credit Amount</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small text-secondary text-uppercase">Description</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Reason for credit allocation..."
                  value={creditDescription}
                  onChange={(e) => setCreditDescription(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <button
                  className="btn btn-outline-primary w-100"
                  onClick={handleBulkCredits}
                  disabled={processingCredit || !creditAmount || !creditDescription.trim()}
                >
                  {processingCredit ? "Processing..." : "Bulk Add"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Users Grid */}
        <section className="mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 mb-0">Eligible Users ({filteredUsers.length})</h2>
          </div>
          
          <div className="row g-3">
            {filteredUsers.length === 0 ? (
              <div className="col-12">
                <div className="card">
                  <div className="card-body text-center py-5">
                    <Icon icon="mdi:account-search" width={48} height={48} className="text-muted mb-3" />
                    <h5 className="text-muted">No eligible users found</h5>
                    <p className="text-muted small">
                      Eligible users include startup, vendor, and member roles, or users with basic/vendor tenant status.
                    </p>
                    <p className="text-secondary">Try adjusting your search criteria</p>
                  </div>
                </div>
              </div>
            ) : (
              filteredUsers.map((user) => {
                const balance = getUserWalletBalance(user.uid);
                return (
                  <div key={user.uid} className="col-12 col-md-6 col-xl-4">
                    <article className="wallet-credits__card card h-100">
                      <div className="card-body d-flex flex-column">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="wallet-credits__badge badge text-bg-light">{user.role}</span>
                          <span className="wallet-credits__balance">
                            <Icon icon="mdi:wallet" className="me-1" />
                            {balance.toFixed(2)} credits
                          </span>
                        </div>
                        
                        <div className="d-flex align-items-center mb-3">
                          <div className="wallet-credits__avatar">
                            <img 
                              src={user.avatar} 
                              alt={user.name}
                              className="rounded-circle"
                              width={40}
                              height={40}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('d-none');
                              }}
                            />
                            <Icon icon="mdi:account" width={40} height={40} className="d-none" />
                          </div>
                          <div className="ms-3">
                            <h3 className="h6 mb-0">{user.name || "Unnamed User"}</h3>
                            <p className="text-secondary small mb-0">{user.email}</p>
                          </div>
                        </div>
                        
                        <dl className="row g-0 small mb-0 flex-grow-1">
                          <dt className="col-5 text-secondary">Tenant</dt>
                          <dd className="col-7">
                            <span className="badge bg-secondary-subtle text-secondary">{user.tenantId}</span>
                          </dd>
                          <dt className="col-5 text-secondary">Balance</dt>
                          <dd className="col-7">
                            <span className={`fw-medium ${balance > 0 ? 'text-success' : 'text-muted'}`}>
                              {balance.toFixed(2)} credits
                            </span>
                          </dd>
                          <dt className="col-5 text-secondary">Status</dt>
                          <dd className="col-7">
                            <span className={`badge ${balance > 0 ? 'text-bg-success' : 'text-bg-warning'}`}>
                              {balance > 0 ? 'Active' : 'No Credits'}
                            </span>
                          </dd>
                        </dl>
                        
                        <div className="d-flex gap-2 mt-3">
                          <button
                            type="button"
                            className="btn btn-primary flex-fill"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowAddCreditsModal(true);
                            }}
                            disabled={processingCredit}
                            aria-label={`Add credits to ${user.email}`}
                          >
                            <Icon icon="mdi:wallet-plus" className="me-1" />
                            Add Credits
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => {
                              toast.info("Transaction history feature coming soon");
                            }}
                            title="View transaction history"
                          >
                            <Icon icon="mdi:history" width={18} height={18} />
                          </button>
                        </div>
                      </div>
                    </article>
                  </div>
                );
              })
            )}
          </div>
        </section>

      {/* Add Credits Modal */}
      {showAddCreditsModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Add Credits {selectedUser ? `to ${selectedUser.email}` : ""}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowAddCreditsModal(false);
                    setSelectedUser(null);
                    setCreditAmount("");
                    setCreditDescription("");
                  }}
                  disabled={processingCredit}
                ></button>
              </div>
              <div className="modal-body">
                {selectedUser && (
                  <div className="alert alert-info">
                    <Icon icon="mdi:information" className="me-2" />
                    Current balance: <strong>{getUserWalletBalance(selectedUser.uid).toFixed(2)} credits</strong>
                  </div>
                )}
                
                <div className="mb-3">
                  <label className="form-label">Credit Amount <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    disabled={processingCredit}
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Description <span className="text-danger">*</span></label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Reason for credit allocation..."
                    value={creditDescription}
                    onChange={(e) => setCreditDescription(e.target.value)}
                    disabled={processingCredit}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddCreditsModal(false);
                    setSelectedUser(null);
                    setCreditAmount("");
                    setCreditDescription("");
                  }}
                  disabled={processingCredit}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddCredits}
                  disabled={processingCredit || !creditAmount || !creditDescription.trim()}
                >
                  {processingCredit ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Icon icon="mdi:wallet-plus" className="me-2" />
                      Add Credits
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </section>
  );
}
