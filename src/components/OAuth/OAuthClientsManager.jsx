import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase';
import './OAuthClientsManager.css';

const OAuthClientsManager = () => {
  const [clients, setClients] = useState([]);
  const [scopes, setScopes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    description: '',
    redirectUris: [''],
    scopes: []
  });
  const [createdClient, setCreatedClient] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();

      const [clientsRes, scopesRes] = await Promise.all([
        fetch('/api/oauth/clients', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/oauth/scopes')
      ]);

      const [clientsData, scopesData] = await Promise.all([
        clientsRes.json(),
        scopesRes.json()
      ]);

      if (clientsData.success) {
        setClients(clientsData.data);
      }

      if (scopesData.success) {
        setScopes(scopesData.data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Load data error:', error);
      setLoading(false);
    }
  };

  const createClient = async () => {
    if (!newClient.name || newClient.redirectUris.filter(uri => uri.trim()).length === 0) {
      alert('Please provide a name and at least one redirect URI');
      return;
    }

    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();

      const response = await fetch('/api/oauth/clients', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newClient,
          redirectUris: newClient.redirectUris.filter(uri => uri.trim()),
          grantTypes: ['authorization_code', 'refresh_token']
        })
      });

      const data = await response.json();

      if (data.success) {
        setCreatedClient(data.data);
        setShowCreateModal(false);
        setNewClient({
          name: '',
          description: '',
          redirectUris: [''],
          scopes: []
        });
        loadData();
      } else {
        alert('Failed to create OAuth client: ' + data.message);
      }
    } catch (error) {
      console.error('Create client error:', error);
      alert('Error creating OAuth client');
    }
  };

  const deleteClient = async (clientId) => {
    if (!confirm('Are you sure? This will revoke all tokens for this client.')) return;

    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();

      const response = await fetch(`/api/oauth/clients/${clientId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        loadData();
      } else {
        alert('Failed to delete OAuth client');
      }
    } catch (error) {
      console.error('Delete client error:', error);
    }
  };

  const addRedirectUri = () => {
    setNewClient({
      ...newClient,
      redirectUris: [...newClient.redirectUris, '']
    });
  };

  const updateRedirectUri = (index, value) => {
    const updated = [...newClient.redirectUris];
    updated[index] = value;
    setNewClient({ ...newClient, redirectUris: updated });
  };

  const removeRedirectUri = (index) => {
    const updated = newClient.redirectUris.filter((_, i) => i !== index);
    setNewClient({ ...newClient, redirectUris: updated });
  };

  const toggleScope = (scope) => {
    if (newClient.scopes.includes(scope)) {
      setNewClient({
        ...newClient,
        scopes: newClient.scopes.filter(s => s !== scope)
      });
    } else {
      setNewClient({
        ...newClient,
        scopes: [...newClient.scopes, scope]
      });
    }
  };

  if (loading) {
    return <div className="loading">Loading OAuth clients...</div>;
  }

  return (
    <div className="oauth-clients-manager">
      <div className="manager-header">
        <h2>OAuth 2.0 Clients</h2>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          Register New Client
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="empty-state">
          <p>No OAuth clients registered yet</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            Register Your First Client
          </button>
        </div>
      ) : (
        <div className="clients-list">
          {clients.map((client) => (
            <div key={client.id} className="client-card">
              <div className="client-header">
                <div>
                  <h3>{client.name}</h3>
                  {client.description && (
                    <p className="client-description">{client.description}</p>
                  )}
                </div>
                <span className={`status-badge ${client.active ? 'status-active' : 'status-inactive'}`}>
                  {client.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="client-details">
                <div className="detail-row">
                  <label>Client ID</label>
                  <code>{client.clientId}</code>
                </div>

                <div className="detail-row">
                  <label>Redirect URIs</label>
                  <div className="uri-list">
                    {client.redirectUris.map((uri, i) => (
                      <code key={i}>{uri}</code>
                    ))}
                  </div>
                </div>

                <div className="detail-row">
                  <label>Authorized Scopes</label>
                  <div className="scope-tags">
                    {client.scopes.map((scope) => (
                      <span key={scope} className="scope-tag">{scope}</span>
                    ))}
                  </div>
                </div>

                <div className="detail-row">
                  <label>Grant Types</label>
                  <div className="grant-tags">
                    {client.grantTypes.map((grant) => (
                      <span key={grant} className="grant-tag">{grant}</span>
                    ))}
                  </div>
                </div>

                <div className="detail-row">
                  <label>Created</label>
                  <span>{new Date(client.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="client-actions">
                <button onClick={() => deleteClient(client.clientId)} className="btn-danger">
                  Delete Client
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <h2>Register OAuth Client</h2>

            <div className="form-group">
              <label>Application Name *</label>
              <input
                type="text"
                placeholder="My App"
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                placeholder="Brief description of your application"
                value={newClient.description}
                onChange={(e) => setNewClient({ ...newClient, description: e.target.value })}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Redirect URIs * (OAuth callback URLs)</label>
              {newClient.redirectUris.map((uri, index) => (
                <div key={index} className="uri-input-group">
                  <input
                    type="url"
                    placeholder="https://your-app.com/oauth/callback"
                    value={uri}
                    onChange={(e) => updateRedirectUri(index, e.target.value)}
                  />
                  {newClient.redirectUris.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRedirectUri(index)}
                      className="btn-icon"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addRedirectUri} className="btn-secondary btn-small">
                + Add Another URI
              </button>
            </div>

            <div className="form-group">
              <label>Select Scopes ({newClient.scopes.length} selected)</label>
              <div className="scopes-checklist">
                {scopes.map((scopeItem) => (
                  <label key={scopeItem.scope} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newClient.scopes.includes(scopeItem.scope)}
                      onChange={() => toggleScope(scopeItem.scope)}
                    />
                    <span>
                      <strong>{scopeItem.scope}</strong>
                      <small>{scopeItem.description}</small>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={createClient}
                className="btn-primary"
                disabled={!newClient.name || newClient.redirectUris.filter(uri => uri.trim()).length === 0}
              >
                Register Client
              </button>
            </div>
          </div>
        </div>
      )}

      {createdClient && (
        <div className="modal-overlay" onClick={() => setCreatedClient(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Client Created Successfully! 🎉</h2>
            
            <div className="success-message">
              <p>Your OAuth client has been registered. <strong>Save these credentials securely - the client secret will not be shown again!</strong></p>
            </div>

            <div className="credentials-box">
              <div className="credential-item">
                <label>Client ID</label>
                <code className="credential-value">{createdClient.clientId}</code>
              </div>

              <div className="credential-item">
                <label>Client Secret</label>
                <code className="credential-value secret">{createdClient.clientSecret}</code>
              </div>
            </div>

            <div className="integration-guide">
              <h3>Next Steps:</h3>
              <ol>
                <li>Save the Client ID and Client Secret in a secure location</li>
                <li>Implement the OAuth 2.0 authorization code flow in your application</li>
                <li>Redirect users to: <code>/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_URI&response_type=code&scope=SCOPES</code></li>
                <li>Exchange the authorization code for an access token at <code>/oauth/token</code></li>
              </ol>
            </div>

            <div className="modal-actions">
              <button onClick={() => setCreatedClient(null)} className="btn-primary">
                I've Saved These Credentials
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OAuthClientsManager;
