import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './UsageDashboard.css';

const UsageDashboard = ({ compact = false }) => {
  const [summary, setSummary] = useState(null);
  const [timeSeries, setTimeSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('24h');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();

      const [summaryRes, timeSeriesRes] = await Promise.all([
        fetch(`/api/developer/usage-summary?period=${period}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/developer/api-keys?limit=1`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(async (res) => {
          const data = await res.json();
          if (data.success && data.data.length > 0) {
            const keyId = data.data[0].id;
            return fetch(`/api/developer/api-keys/${keyId}/timeseries?period=${period}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
          }
          return null;
        })
      ]);

      const summaryData = await summaryRes.json();
      if (summaryData.success) {
        setSummary(summaryData.data);
      }

      if (timeSeriesRes) {
        const timeSeriesData = await timeSeriesRes.json();
        if (timeSeriesData.success) {
          setTimeSeries(timeSeriesData.data.series);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Load usage data error:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading usage data...</div>;
  }

  if (!summary) {
    return <div className="empty-state">No usage data available</div>;
  }

  if (compact) {
    return (
      <div className="usage-dashboard compact">
        <h2>Usage Overview</h2>
        <div className="stats-row">
          <div className="stat-item">
            <label>Total Requests</label>
            <value>{summary.totalRequests.toLocaleString()}</value>
          </div>
          <div className="stat-item">
            <label>Success Rate</label>
            <value>{(100 - parseFloat(summary.errorRate)).toFixed(1)}%</value>
          </div>
          <div className="stat-item">
            <label>Avg Response Time</label>
            <value>{summary.avgResponseTime}ms</value>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="usage-dashboard">
      <div className="dashboard-header">
        <h2>Usage Dashboard</h2>
        <div className="period-selector">
          <button
            className={period === '24h' ? 'active' : ''}
            onClick={() => setPeriod('24h')}
          >
            24 Hours
          </button>
          <button
            className={period === '7d' ? 'active' : ''}
            onClick={() => setPeriod('7d')}
          >
            7 Days
          </button>
          <button
            className={period === '30d' ? 'active' : ''}
            onClick={() => setPeriod('30d')}
          >
            30 Days
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Requests</h3>
          <div className="metric-value">{summary.totalRequests.toLocaleString()}</div>
          <p className="metric-label">All API keys combined</p>
        </div>
        <div className="metric-card">
          <h3>Success Rate</h3>
          <div className="metric-value">{(100 - parseFloat(summary.errorRate)).toFixed(1)}%</div>
          <p className="metric-label">{summary.successfulRequests.toLocaleString()} successful</p>
        </div>
        <div className="metric-card">
          <h3>Error Rate</h3>
          <div className="metric-value">{summary.errorRate}%</div>
          <p className="metric-label">{summary.failedRequests.toLocaleString()} failed</p>
        </div>
        <div className="metric-card">
          <h3>Avg Response Time</h3>
          <div className="metric-value">{summary.avgResponseTime}ms</div>
          <p className="metric-label">Across all requests</p>
        </div>
      </div>

      {timeSeries.length > 0 && (
        <div className="chart-section">
          <h3>Request Volume Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(ts) => new Date(ts).toLocaleString()}
              />
              <Legend />
              <Line type="monotone" dataKey="requests" stroke="#8884d8" name="Requests" />
              <Line type="monotone" dataKey="successful" stroke="#82ca9d" name="Successful" />
              <Line type="monotone" dataKey="failed" stroke="#ff6b6b" name="Failed" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="tables-row">
        <div className="table-section">
          <h3>Top Endpoints</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Requests</th>
              </tr>
            </thead>
            <tbody>
              {summary.topEndpoints.slice(0, 5).map((item, i) => (
                <tr key={i}>
                  <td><code>{item.endpoint}</code></td>
                  <td>{item.count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-section">
          <h3>Requests by API Key</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Key Name</th>
                <th>Requests</th>
              </tr>
            </thead>
            <tbody>
              {summary.requestsByKey.map((item, i) => (
                <tr key={i}>
                  <td>{item.keyName}</td>
                  <td>{item.requests.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsageDashboard;
