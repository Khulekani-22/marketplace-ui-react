import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import './OAuthConsent.css';

const OAuthConsent = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [consentData, setConsentData] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadConsentRequest();
  }, []);

  const loadConsentRequest = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('Please sign in to authorize');
        setLoading(false);
        return;
      }

      // Get authorization parameters from URL
      const clientId = searchParams.get('client_id');
      const redirectUri = searchParams.get('redirect_uri');
      const responseType = searchParams.get('response_type');
      const scope = searchParams.get('scope');
      const state = searchParams.get('state');
      const codeChallenge = searchParams.get('code_challenge');
      const codeChallengeMethod = searchParams.get('code_challenge_method');

      if (!clientId || !redirectUri || !responseType || !scope) {
        setError('Invalid authorization request - missing required parameters');
        setLoading(false);
        return;
      }

      // Build authorization URL
      const authUrl = new URL('/api/oauth/authorize', window.location.origin);
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', responseType);
      authUrl.searchParams.set('scope', scope);
      if (state) authUrl.searchParams.set('state', state);
      if (codeChallenge) authUrl.searchParams.set('code_challenge', codeChallenge);
      if (codeChallengeMethod) authUrl.searchParams.set('code_challenge_method', codeChallengeMethod);

      const token = await user.getIdToken();
      const response = await fetch(authUrl.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to load authorization request');
        setLoading(false);
        return;
      }

      // If user already authorized, redirect immediately
      if (response.redirected || data.redirect) {
        window.location.href = data.redirect;
        return;
      }

      setConsentData(data.data);
      setLoading(false);
    } catch (error) {
      console.error('Load consent error:', error);
      setError('Failed to load authorization request');
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setProcessing(true);
      const user = auth.currentUser;
      const token = await user.getIdToken();

      const response = await fetch('/api/oauth/authorize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: searchParams.get('client_id'),
          redirect_uri: searchParams.get('redirect_uri'),
          scope: searchParams.get('scope'),
          state: searchParams.get('state'),
          code_challenge: searchParams.get('code_challenge'),
          approved: true
        })
      });

      const data = await response.json();

      if (data.success && data.redirect) {
        // Redirect to client app with authorization code
        window.location.href = data.redirect;
      } else {
        setError(data.message || 'Failed to authorize');
        setProcessing(false);
      }
    } catch (error) {
      console.error('Approve error:', error);
      setError('Failed to process authorization');
      setProcessing(false);
    }
  };

  const handleDeny = async () => {
    try {
      setProcessing(true);
      const user = auth.currentUser;
      const token = await user.getIdToken();

      const response = await fetch('/api/oauth/authorize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: searchParams.get('client_id'),
          redirect_uri: searchParams.get('redirect_uri'),
          scope: searchParams.get('scope'),
          state: searchParams.get('state'),
          approved: false
        })
      });

      const data = await response.json();

      if (data.redirect) {
        // Redirect back to client with error
        window.location.href = data.redirect;
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Deny error:', error);
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="oauth-consent">
        <div className="consent-container">
          <div className="loading">Loading authorization request...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="oauth-consent">
        <div className="consent-container">
          <div className="error-state">
            <h2>Authorization Error</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/')} className="btn-primary">
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!consentData) {
    return null;
  }

  return (
    <div className="oauth-consent">
      <div className="consent-container">
        <div className="consent-header">
          <div className="app-icon">🔐</div>
          <h1>Authorization Request</h1>
          <p className="user-info">
            Signing in as <strong>{consentData.user.email}</strong>
          </p>
        </div>

        <div className="client-info">
          <h2>{consentData.client.name}</h2>
          {consentData.client.description && (
            <p className="client-description">{consentData.client.description}</p>
          )}
          <p className="permission-intro">
            This application is requesting permission to:
          </p>
        </div>

        <div className="scopes-list">
          {consentData.requestedScopes.map((scopeItem) => (
            <div key={scopeItem.scope} className="scope-item">
              <span className="scope-icon">✓</span>
              <div className="scope-details">
                <div className="scope-name">{scopeItem.scope}</div>
                <div className="scope-description">{scopeItem.description}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="consent-actions">
          <button
            onClick={handleDeny}
            disabled={processing}
            className="btn-secondary"
          >
            Deny
          </button>
          <button
            onClick={handleApprove}
            disabled={processing}
            className="btn-primary"
          >
            {processing ? 'Authorizing...' : 'Authorize'}
          </button>
        </div>

        <div className="consent-footer">
          <p>
            By authorizing, you allow <strong>{consentData.client.name}</strong> to access
            your account information according to the permissions listed above.
            You can revoke this authorization at any time from your account settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OAuthConsent;
