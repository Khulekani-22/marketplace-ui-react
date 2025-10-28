// Temporary diagnostic component for dashboard issues
// Add this to Dashboard.tsx to see what's happening

import { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { api } from '../lib/api';

export default function DashboardDiagnostic() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function runDiagnostics() {
      const diag: any = {
        timestamp: new Date().toISOString(),
        auth: {},
        api: {},
        backend: {},
        firestore: {}
      };

      // 1. Check Authentication
      const user = auth.currentUser;
      diag.auth = {
        authenticated: !!user,
        email: user?.email || 'Not signed in',
        uid: user?.uid || 'N/A',
        tenantId: sessionStorage.getItem('tenantId') || '(not set)'
      };

      // 2. Check API Base URL
      diag.api = {
        baseURL: api.defaults.baseURL,
        isVercel: window.location.hostname.endsWith('.vercel.app'),
        hostname: window.location.hostname,
        origin: window.location.origin
      };

      // 3. Test Backend Health
      try {
        const healthRes = await fetch('/api/health/status');
        diag.backend.health = {
          status: healthRes.status,
          ok: healthRes.ok,
          data: await healthRes.json()
        };
      } catch (error: any) {
        diag.backend.health = {
          error: error.message,
          failed: true
        };
      }

      // 4. Test Services Endpoint (without auth)
      try {
        const servicesRes = await fetch('/api/data/services?page=1&pageSize=5');
        const servicesData = await servicesRes.json();
        diag.backend.services = {
          status: servicesRes.status,
          ok: servicesRes.ok,
          total: servicesData.total || 0,
          itemsCount: servicesData.items?.length || 0,
          hasItems: (servicesData.items?.length || 0) > 0
        };
      } catch (error: any) {
        diag.backend.services = {
          error: error.message,
          failed: true
        };
      }

      // 5. Test Services Endpoint with API client (with auth)
      if (user) {
        try {
          const { data } = await api.get('/api/data/services', {
            params: { page: 1, pageSize: 5 }
          });
          diag.api.servicesWithAuth = {
            total: data.total || 0,
            itemsCount: data.items?.length || 0,
            hasItems: (data.items?.length || 0) > 0,
            firstItem: data.items?.[0] ? {
              id: data.items[0].id,
              title: data.items[0].title,
              status: data.items[0].status
            } : null
          };
        } catch (error: any) {
          diag.api.servicesWithAuth = {
            error: error.message,
            response: error.response?.data,
            status: error.response?.status,
            failed: true
          };
        }
      }

      setResults(diag);
      setLoading(false);
    }

    runDiagnostics();
  }, []);

  if (loading) {
    return (
      <div className="alert alert-info">
        <div className="spinner-border spinner-border-sm me-2" />
        Running diagnostics...
      </div>
    );
  }

  const hasErrors = 
    results.backend?.health?.failed ||
    results.backend?.services?.failed ||
    results.api?.servicesWithAuth?.failed;

  return (
    <div className={`alert ${hasErrors ? 'alert-danger' : 'alert-success'} mb-4`}>
      <h5 className="alert-heading">
        {hasErrors ? '❌ Dashboard Diagnostics - Issues Found' : '✅ Dashboard Diagnostics - All OK'}
      </h5>
      
      <details className="mt-3">
        <summary style={{ cursor: 'pointer', userSelect: 'none' }}>
          <strong>View Diagnostic Details</strong>
        </summary>
        
        <div className="mt-3">
          {/* Authentication */}
          <div className="mb-3">
            <h6>🔐 Authentication</h6>
            <small>
              <div>Status: {results.auth?.authenticated ? '✅ Signed in' : '❌ Not signed in'}</div>
              <div>Email: {results.auth?.email}</div>
              <div>UID: {results.auth?.uid}</div>
              <div>Tenant: {results.auth?.tenantId}</div>
            </small>
          </div>

          {/* API Configuration */}
          <div className="mb-3">
            <h6>🔗 API Configuration</h6>
            <small>
              <div>Base URL: {results.api?.baseURL}</div>
              <div>Is Vercel: {results.api?.isVercel ? 'Yes' : 'No'}</div>
              <div>Hostname: {results.api?.hostname}</div>
            </small>
          </div>

          {/* Backend Health */}
          <div className="mb-3">
            <h6>❤️ Backend Health</h6>
            {results.backend?.health?.failed ? (
              <small className="text-danger">
                ❌ Failed: {results.backend.health.error}
              </small>
            ) : (
              <small>
                <div>Status: {results.backend?.health?.status} {results.backend?.health?.ok ? '✅' : '❌'}</div>
                <div>Uptime: {results.backend?.health?.data?.uptime || 'N/A'}</div>
              </small>
            )}
          </div>

          {/* Services Endpoint */}
          <div className="mb-3">
            <h6>📦 Services Endpoint (No Auth)</h6>
            {results.backend?.services?.failed ? (
              <small className="text-danger">
                ❌ Failed: {results.backend.services.error}
              </small>
            ) : (
              <small>
                <div>Status: {results.backend?.services?.status} {results.backend?.services?.ok ? '✅' : '❌'}</div>
                <div>Total Services: {results.backend?.services?.total}</div>
                <div>Items Returned: {results.backend?.services?.itemsCount}</div>
                <div>Has Data: {results.backend?.services?.hasItems ? '✅ Yes' : '❌ No'}</div>
              </small>
            )}
          </div>

          {/* Services with Auth */}
          {results.auth?.authenticated && (
            <div className="mb-3">
              <h6>🔐 Services Endpoint (With Auth)</h6>
              {results.api?.servicesWithAuth?.failed ? (
                <small className="text-danger">
                  <div>❌ Failed: {results.api.servicesWithAuth.error}</div>
                  {results.api.servicesWithAuth.status && (
                    <div>Status: {results.api.servicesWithAuth.status}</div>
                  )}
                  {results.api.servicesWithAuth.response && (
                    <div>Response: {JSON.stringify(results.api.servicesWithAuth.response)}</div>
                  )}
                </small>
              ) : (
                <small>
                  <div>Total Services: {results.api?.servicesWithAuth?.total}</div>
                  <div>Items Returned: {results.api?.servicesWithAuth?.itemsCount}</div>
                  <div>Has Data: {results.api?.servicesWithAuth?.hasItems ? '✅ Yes' : '❌ No'}</div>
                  {results.api?.servicesWithAuth?.firstItem && (
                    <div>First Item: {results.api.servicesWithAuth.firstItem.title} (status: {results.api.servicesWithAuth.firstItem.status})</div>
                  )}
                </small>
              )}
            </div>
          )}

          {/* Raw Data */}
          <details className="mt-3">
            <summary style={{ cursor: 'pointer', userSelect: 'none' }}>
              <small><strong>View Raw JSON</strong></small>
            </summary>
            <pre className="mt-2 p-2 bg-light" style={{ fontSize: '10px', maxHeight: '300px', overflow: 'auto' }}>
              {JSON.stringify(results, null, 2)}
            </pre>
          </details>
        </div>
      </details>

      {/* Quick Actions */}
      <div className="mt-3">
        <button 
          className="btn btn-sm btn-outline-primary me-2"
          onClick={() => window.location.reload()}
        >
          Reload Page
        </button>
        <button 
          className="btn btn-sm btn-outline-secondary"
          onClick={() => {
            console.log('Dashboard Diagnostics:', results);
            alert('Results logged to console');
          }}
        >
          Log to Console
        </button>
      </div>
    </div>
  );
}
