import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase';
import ApiKeysManager from './ApiKeysManager';
import UsageDashboard from './UsageDashboard';
import WebhooksManager from './WebhooksManager';
import ApiExplorer from './ApiExplorer';
import Documentation from './Documentation';
import OAuthClientsManager from '../OAuth/OAuthClientsManager';
import './DeveloperPortal.css';

const DeveloperPortal = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('Please sign in to access the developer portal');
        setLoading(false);
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch('/api/developer/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const data = await response.json();
      setProfile(data.data);
      setLoading(false);
    } catch (err) {
      console.error('Load profile error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="developer-portal loading">
        <div className="spinner"></div>
        <p>Loading developer portal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="developer-portal error">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="developer-portal">
      <header className="portal-header">
        <h1>Developer Portal</h1>
        <div className="profile-summary">
          <span className="email">{profile.email}</span>
          <span className="badge">{profile.totalRequests.toLocaleString()} requests</span>
        </div>
      </header>

      <nav className="portal-nav">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'api-keys' ? 'active' : ''}
          onClick={() => setActiveTab('api-keys')}
        >
          API Keys
          <span className="count">{profile.apiKeysCount}</span>
        </button>
        <button
          className={activeTab === 'usage' ? 'active' : ''}
          onClick={() => setActiveTab('usage')}
        >
          Usage
        </button>
        <button
          className={activeTab === 'webhooks' ? 'active' : ''}
          onClick={() => setActiveTab('webhooks')}
        >
          Webhooks
          <span className="count">{profile.webhooksCount}</span>
        </button>
        <button
          className={activeTab === 'oauth' ? 'active' : ''}
          onClick={() => setActiveTab('oauth')}
        >
          OAuth Clients
        </button>
        <button
          className={activeTab === 'explorer' ? 'active' : ''}
          onClick={() => setActiveTab('explorer')}
        >
          API Explorer
        </button>
        <button
          className={activeTab === 'docs' ? 'active' : ''}
          onClick={() => setActiveTab('docs')}
        >
          Documentation
        </button>
      </nav>

      <main className="portal-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>API Keys</h3>
                <div className="stat-value">{profile.apiKeysCount}</div>
                <p>Active keys</p>
              </div>
              <div className="stat-card">
                <h3>Total Requests</h3>
                <div className="stat-value">{profile.totalRequests.toLocaleString()}</div>
                <p>All time</p>
              </div>
              <div className="stat-card">
                <h3>Webhooks</h3>
                <div className="stat-value">{profile.webhooksCount}</div>
                <p>Active webhooks</p>
              </div>
              <div className="stat-card">
                <h3>Member Since</h3>
                <div className="stat-value">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </div>
                <p>Account created</p>
              </div>
            </div>

            <div className="quick-actions">
              <h2>Quick Actions</h2>
              <div className="action-buttons">
                <button onClick={() => setActiveTab('api-keys')} className="action-btn primary">
                  Create API Key
                </button>
                <button onClick={() => setActiveTab('webhooks')} className="action-btn">
                  Add Webhook
                </button>
                <button onClick={() => setActiveTab('explorer')} className="action-btn">
                  Try API
                </button>
                <button onClick={() => setActiveTab('docs')} className="action-btn">
                  View Docs
                </button>
              </div>
            </div>

            <UsageDashboard compact />
          </div>
        )}

        {activeTab === 'api-keys' && <ApiKeysManager />}
        {activeTab === 'usage' && <UsageDashboard />}
        {activeTab === 'webhooks' && <WebhooksManager />}
        {activeTab === 'oauth' && <OAuthClientsManager />}
        {activeTab === 'explorer' && <ApiExplorer />}
        {activeTab === 'docs' && <Documentation />}
      </main>
    </div>
  );
};

export default DeveloperPortal;
