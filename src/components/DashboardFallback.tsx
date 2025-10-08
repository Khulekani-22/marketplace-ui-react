// src/components/DashboardFallback.tsx
import React from 'react';
import MasterLayout from '../masterLayout/MasterLayout';

const DashboardFallback: React.FC = () => {
  return (
    <MasterLayout>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="alert alert-warning text-center">
              <i className="bi bi-exclamation-triangle-fill fs-1 text-warning mb-3"></i>
              <h4 className="mb-3">Dashboard temporarily unavailable</h4>
              <p className="mb-4">
                We're experiencing some technical difficulties loading the dashboard. 
                This could be due to a slow connection or server maintenance.
              </p>
              <div className="d-flex gap-2 justify-content-center flex-wrap">
                <button 
                  className="btn btn-primary"
                  onClick={() => window.location.reload()}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Try Again
                </button>
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => window.history.back()}
                >
                  <i className="bi bi-arrow-left me-1"></i>
                  Go Back
                </button>
                <a href="/marketplace" className="btn btn-outline-primary">
                  <i className="bi bi-shop me-1"></i>
                  Visit Marketplace
                </a>
              </div>
              <hr className="my-4" />
              <p className="text-muted small mb-0">
                If this problem persists, please contact support or try accessing the dashboard later.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MasterLayout>
  );
};

export default DashboardFallback;
