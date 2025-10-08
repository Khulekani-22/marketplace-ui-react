// src/components/DashboardLoading.tsx
import React from 'react';
import MasterLayout from '../masterLayout/MasterLayout';

const DashboardLoading: React.FC = () => {
  return (
    <MasterLayout>
      <div className="container py-5">
        <div className="row">
          <div className="col-12">
            {/* Header skeleton */}
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div>
                <div className="placeholder-glow">
                  <span className="placeholder col-6 h4"></span>
                </div>
                <div className="placeholder-glow">
                  <span className="placeholder col-8"></span>
                </div>
              </div>
              <div className="placeholder-glow">
                <span className="placeholder col-3 btn"></span>
              </div>
            </div>

            {/* Stats cards skeleton */}
            <div className="row gy-4 mb-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="col-xl-3 col-sm-6">
                  <div className="card">
                    <div className="card-body">
                      <div className="placeholder-glow">
                        <div className="d-flex align-items-center justify-content-between">
                          <div>
                            <span className="placeholder col-8 mb-2"></span>
                            <span className="placeholder col-6 h5"></span>
                          </div>
                          <span className="placeholder col-3" style={{ height: '40px' }}></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Main content skeleton */}
            <div className="row gy-4">
              <div className="col-xl-8">
                <div className="card">
                  <div className="card-header">
                    <div className="placeholder-glow">
                      <span className="placeholder col-4"></span>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="placeholder-glow">
                      <span className="placeholder col-12 mb-3" style={{ height: '200px' }}></span>
                      <span className="placeholder col-8"></span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-4">
                <div className="card">
                  <div className="card-header">
                    <div className="placeholder-glow">
                      <span className="placeholder col-6"></span>
                    </div>
                  </div>
                  <div className="card-body">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="d-flex align-items-center mb-3">
                        <div className="placeholder-glow me-3">
                          <span className="placeholder rounded-circle" style={{ width: '40px', height: '40px' }}></span>
                        </div>
                        <div className="placeholder-glow flex-grow-1">
                          <span className="placeholder col-12 mb-1"></span>
                          <span className="placeholder col-8"></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Loading indicator */}
            <div className="text-center mt-4">
              <div className="d-flex align-items-center justify-content-center gap-2">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <span className="text-muted">Loading dashboard data...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MasterLayout>
  );
};

export default DashboardLoading;
