import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { auth } from '../firebase';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'loading';
  message: string;
  data?: any;
}

const DashboardDebug = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [authUser, setAuthUser] = useState<any>(null);

  useEffect(() => {
    const runDiagnostics = async () => {
      const tests: DiagnosticResult[] = [];

      // Test 1: Check auth
      tests.push({
        test: 'Firebase Auth',
        status: 'loading',
        message: 'Checking authentication...'
      });
      
      try {
        const user = auth.currentUser;
        setAuthUser(user);
        tests[0] = {
          test: 'Firebase Auth',
          status: user ? 'success' : 'error',
          message: user ? `Logged in as ${user.email}` : 'Not authenticated',
          data: user ? { uid: user.uid, email: user.email } : null
        };
      } catch (err: any) {
        tests[0] = {
          test: 'Firebase Auth',
          status: 'error',
          message: err.message
        };
      }

      // Test 2: Services API
      tests.push({
        test: 'Services API',
        status: 'loading',
        message: 'Fetching services...'
      });

      try {
        const servicesRes = await api.get('/api/data/services?page=1&pageSize=3');
        tests[1] = {
          test: 'Services API',
          status: 'success',
          message: `Found ${servicesRes.data.total} services`,
          data: { count: servicesRes.data.total, items: servicesRes.data.items?.length }
        };
      } catch (err: any) {
        tests[1] = {
          test: 'Services API',
          status: 'error',
          message: err.response?.data?.message || err.message
        };
      }

      // Test 3: Startups API
      tests.push({
        test: 'Startups API',
        status: 'loading',
        message: 'Fetching startups...'
      });

      try {
        const startupsRes = await api.get('/api/data/startups');
        tests[2] = {
          test: 'Startups API',
          status: 'success',
          message: `Found ${startupsRes.data.total} startups`,
          data: { count: startupsRes.data.total, items: startupsRes.data.items?.length }
        };
      } catch (err: any) {
        tests[2] = {
          test: 'Startups API',
          status: 'error',
          message: err.response?.data?.message || err.message
        };
      }

      // Test 4: Vendors API
      tests.push({
        test: 'Vendors API',
        status: 'loading',
        message: 'Fetching vendors...'
      });

      try {
        const vendorsRes = await api.get('/api/data/vendors');
        tests[3] = {
          test: 'Vendors API',
          status: 'success',
          message: `Found ${vendorsRes.data.total} vendors`,
          data: { count: vendorsRes.data.total, items: vendorsRes.data.items?.length }
        };
      } catch (err: any) {
        tests[3] = {
          test: 'Vendors API',
          status: 'error',
          message: err.response?.data?.message || err.message
        };
      }

      setResults(tests);
    };

    runDiagnostics();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-success';
      case 'error': return 'text-danger';
      case 'loading': return 'text-warning';
      default: return 'text-secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'loading': return '⏳';
      default: return '❓';
    }
  };

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">🔍 Dashboard Diagnostic</h3>
            </div>
            <div className="card-body">
              <h5>Authentication Status</h5>
              {authUser ? (
                <div className="alert alert-success">
                  <strong>✅ Authenticated</strong>
                  <br />
                  <small>
                    Email: {authUser.email}<br />
                    UID: {authUser.uid}
                  </small>
                </div>
              ) : (
                <div className="alert alert-warning">
                  <strong>⚠️ Not Authenticated</strong>
                  <br />
                  <small>Please sign in to test dashboard functionality</small>
                </div>
              )}

              <hr />

              <h5>API Tests</h5>
              <div className="list-group">
                {results.map((result, index) => (
                  <div key={index} className="list-group-item">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <h6 className="mb-1">
                          {getStatusIcon(result.status)} {result.test}
                        </h6>
                        <p className={`mb-1 ${getStatusColor(result.status)}`}>
                          {result.message}
                        </p>
                        {result.data && (
                          <small className="text-muted">
                            <pre className="mb-0">{JSON.stringify(result.data, null, 2)}</pre>
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <hr />

              <h5>Next Steps</h5>
              <div className="alert alert-info">
                <strong>If all tests pass:</strong>
                <ul className="mb-0">
                  <li>Dashboard components should work</li>
                  <li>Try accessing <a href="/dashboard">/dashboard</a></li>
                  <li>Check browser console for errors</li>
                </ul>
              </div>

              <div className="alert alert-warning">
                <strong>If tests fail:</strong>
                <ul className="mb-0">
                  <li>Check CORS configuration</li>
                  <li>Verify environment variables</li>
                  <li>Check Firebase authentication</li>
                  <li>Review Vercel function logs</li>
                </ul>
              </div>

              <div className="mt-3">
                <a href="/dashboard" className="btn btn-primary me-2">
                  Go to Dashboard
                </a>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => window.location.reload()}
                >
                  Rerun Tests
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardDebug;
