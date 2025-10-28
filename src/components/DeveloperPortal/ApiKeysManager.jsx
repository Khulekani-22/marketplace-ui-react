import React, { useState, useEffect, useCallback } from 'react';
import { auth } from '../../firebase';
import './ApiKeysManager.css';

const ApiKeysManager = () => {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [newKeyData, setNewKeyData] = useState({ name: '', tier: 'free' });

  const loadApiKeys = useCallback(async (options = {}) => {
    const { signal } = options;

    try {
      if (!signal?.aborted) {
        setLoading(true);
      }
      const user = auth.currentUser;
      if (!user) {
        if (!signal?.aborted) {
          setApiKeys([]);
          setLoading(false);
        }
        return;
      }

      const token = await user.getIdToken();

      const response = await fetch('/api/developer/api-keys', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!signal?.aborted && data.success) {
        setApiKeys(data.data);
      }
      if (!signal?.aborted) {
        setLoading(false);
      }
    } catch (error) {
      console.error('Load API keys error:', error);
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const context = { aborted: false };
    setLoading(true);
    loadApiKeys({ signal: context });
    return () => {
      context.aborted = true;
    };
  }, [loadApiKeys]);

  const createApiKey = async () => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();

      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newKeyData)
      });

      const data = await response.json();
      if (data.success) {
        alert(`API Key Created!\n\nKey: ${data.data.key}\n\nSave this key securely - you won't see it again!`);
        setShowCreateModal(false);
        setNewKeyData({ name: '', tier: 'free' });
  loadApiKeys();
      }
    } catch (error) {
      console.error('Create API key error:', error);
      alert('Failed to create API key');
    }
  };

  const deleteApiKey = async (keyId) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();

      const response = await fetch(`/api/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
  loadApiKeys();
      }
    } catch (error) {
      console.error('Delete API key error:', error);
      alert('Failed to delete API key');
    }
  };

  const rotateApiKey = async (keyId) => {
    if (!confirm('Rotate this API key? The old key will stop working immediately.')) return;

    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();

      const response = await fetch(`/api/api-keys/${keyId}/rotate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        alert(`New API Key: ${data.data.newKey}\n\nSave this securely!`);
  loadApiKeys();
      }
    } catch (error) {
      console.error('Rotate API key error:', error);
      alert('Failed to rotate API key');
    }
  };

  const viewKeyUsage = (key) => {
    setSelectedKey(key);
  };

  if (loading) {
    return <div className="loading">Loading API keys...</div>;
  }

  return (
    <div className="api-keys-manager">
      <div className="header">
        <h2>API Keys</h2>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          Create New Key
        </button>
      </div>

      {apiKeys.length === 0 ? (
        <div className="empty-state">
          <p>No API keys yet. Create your first key to get started!</p>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            Create API Key
          </button>
        </div>
      ) : (
        <div className="keys-list">
          {apiKeys.map(key => (
            <div key={key.id} className="key-card">
              <div className="key-header">
                <div>
                  <h3>{key.name}</h3>
                  <code className="key-prefix">{key.keyPrefix}...</code>
                </div>
                <span className={`tier-badge tier-${key.tier}`}>
                  {key.tier}
                </span>
              </div>

              <div className="key-stats">
                <div className="stat">
                  <label>Total Requests</label>
                  <value>{key.totalRequests.toLocaleString()}</value>
                </div>
                <div className="stat">
                  <label>Rate Limit</label>
                  <value>{key.rateLimit.remaining}/{key.rateLimit.limit} remaining</value>
                </div>
                <div className="stat">
                  <label>Status</label>
                  <value>
                    <span className={`status ${key.status}`}>{key.status}</span>
                  </value>
                </div>
                <div className="stat">
                  <label>Last Used</label>
                  <value>{key.lastUsed ? new Date(key.lastUsed).toLocaleString() : 'Never'}</value>
                </div>
              </div>

              {key.expiresAt && (
                <div className="expiry-warning">
                  Expires: {new Date(key.expiresAt).toLocaleDateString()}
                </div>
              )}

              <div className="key-actions">
                <button onClick={() => viewKeyUsage(key)} className="btn-secondary">
                  View Usage
                </button>
                <button onClick={() => rotateApiKey(key.id)} className="btn-secondary">
                  Rotate Key
                </button>
                <button onClick={() => deleteApiKey(key.id)} className="btn-danger">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Create API Key</h2>
            
            <div className="form-group">
              <label>Key Name</label>
              <input
                type="text"
                placeholder="My App"
                value={newKeyData.name}
                onChange={e => setNewKeyData({ ...newKeyData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Tier</label>
              <select
                value={newKeyData.tier}
                onChange={e => setNewKeyData({ ...newKeyData, tier: e.target.value })}
              >
                <option value="free">Free (100 req/hour)</option>
                <option value="standard">Standard (1,000 req/hour)</option>
                <option value="premium">Premium (10,000 req/hour)</option>
              </select>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={createApiKey} className="btn-primary" disabled={!newKeyData.name}>
                Create Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Usage Modal */}
      {selectedKey && (
        <div className="modal-overlay" onClick={() => setSelectedKey(null)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <h2>{selectedKey.name} - Usage Details</h2>
            <KeyUsageDetails keyId={selectedKey.id} />
            <button onClick={() => setSelectedKey(null)} className="btn-secondary">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for key usage details
const KeyUsageDetails = ({ keyId }) => {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUsage = useCallback(async (options = {}) => {
    const { signal } = options;

    try {
      if (!signal?.aborted) {
        setLoading(true);
      }
      const user = auth.currentUser;
      if (!user) {
        if (!signal?.aborted) {
          setUsage(null);
          setLoading(false);
        }
        return;
      }

      const token = await user.getIdToken();

      const response = await fetch(`/api/developer/api-keys/${keyId}/usage`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!signal?.aborted && data.success) {
        setUsage(data.data);
      }
      if (!signal?.aborted) {
        setLoading(false);
      }
    } catch (error) {
      console.error('Load usage error:', error);
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [keyId]);

  useEffect(() => {
    const context = { aborted: false };
    setLoading(true);
    loadUsage({ signal: context });
    return () => {
      context.aborted = true;
    };
  }, [loadUsage]);

  if (loading) return <div>Loading usage data...</div>;
  if (!usage) return <div>No usage data available</div>;

  return (
    <div className="usage-details">
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Total Requests</h4>
          <div className="value">{usage.totalRequests.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <h4>Success Rate</h4>
          <div className="value">{(100 - parseFloat(usage.errorRate)).toFixed(1)}%</div>
        </div>
        <div className="stat-card">
          <h4>Avg Response Time</h4>
          <div className="value">{usage.avgResponseTime}ms</div>
        </div>
      </div>

      <div className="section">
        <h3>Top Endpoints</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Requests</th>
            </tr>
          </thead>
          <tbody>
            {usage.topEndpoints.map((item, i) => (
              <tr key={i}>
                <td><code>{item.endpoint}</code></td>
                <td>{item.count.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section">
        <h3>Recent Activity (Last 24 Hours)</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Endpoint</th>
              <th>Method</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {usage.recentActivity.slice(0, 10).map((req, i) => (
              <tr key={i}>
                <td>{new Date(req.timestamp).toLocaleTimeString()}</td>
                <td><code>{req.endpoint}</code></td>
                <td><span className="method-badge">{req.method}</span></td>
                <td><span className={`status-badge status-${req.statusCode}`}>{req.statusCode}</span></td>
                <td>{req.responseTime}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApiKeysManager;
