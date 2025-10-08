// src/components/DashboardErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';
import MasterLayout from '../masterLayout/MasterLayout';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Dashboard Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <MasterLayout>
          <div className="container py-5">
            <div className="row justify-content-center">
              <div className="col-md-8">
                <div className="alert alert-danger">
                  <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-exclamation-triangle-fill fs-1 text-danger me-3"></i>
                    <div>
                      <h4 className="mb-1">Dashboard Error</h4>
                      <p className="mb-0">Something went wrong while loading the dashboard.</p>
                    </div>
                  </div>
                  
                  <div className="border-top pt-3 mt-3">
                    <h6>What happened?</h6>
                    <p className="small mb-2">
                      The dashboard encountered an unexpected error. This could be due to:
                    </p>
                    <ul className="small">
                      <li>Network connectivity issues</li>
                      <li>Server-side problems</li>
                      <li>Browser compatibility issues</li>
                      <li>Corrupted application state</li>
                    </ul>
                  </div>

                  <div className="border-top pt-3 mt-3">
                    <h6>What can you do?</h6>
                    <div className="d-flex gap-2 flex-wrap">
                      <button 
                        className="btn btn-danger"
                        onClick={() => window.location.reload()}
                      >
                        <i className="bi bi-arrow-clockwise me-1"></i>
                        Reload Page
                      </button>
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          this.setState({ hasError: false, error: null, errorInfo: null });
                        }}
                      >
                        <i className="bi bi-arrow-repeat me-1"></i>
                        Try Again
                      </button>
                      <a href="/marketplace" className="btn btn-outline-primary">
                        <i className="bi bi-shop me-1"></i>
                        Go to Marketplace
                      </a>
                    </div>
                  </div>

                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <div className="border-top pt-3 mt-3">
                      <h6>Error Details (Development)</h6>
                      <pre className="small bg-light p-2 rounded">
                        {this.state.error.toString()}
                        {this.state.errorInfo?.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </MasterLayout>
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;
