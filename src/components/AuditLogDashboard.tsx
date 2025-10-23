// src/components/AuditLogDashboard.tsx
import React from "react";
import { Bar, Pie } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export interface AuditLogStats {
  actionsOverTime: { date: string; count: number }[];
  errorRates: { date: string; errors: number }[];
  topUsers: { user: string; count: number }[];
  totalActions: number;
  totalErrors: number;
  last24hActions: number;
}

export default function AuditLogDashboard({ stats }: { stats: AuditLogStats }) {
  const barData = {
    labels: stats.actionsOverTime.map((d) => d.date),
    datasets: [
      {
        label: "Actions",
        data: stats.actionsOverTime.map((d) => d.count),
        backgroundColor: "#007bff",
      },
      {
        label: "Errors",
        data: stats.errorRates.map((d) => d.errors),
        backgroundColor: "#dc3545",
      },
    ],
  };

  const pieData = {
    labels: stats.topUsers.map((u) => u.user),
    datasets: [
      {
        label: "Top Users",
        data: stats.topUsers.map((u) => u.count),
        backgroundColor: ["#007bff", "#28a745", "#ffc107", "#17a2b8", "#dc3545"],
      },
    ],
  };

  return (
    <div className="row g-4 mb-4">
      <div className="col-md-3">
        <div className="card text-center">
          <div className="card-body">
            <h6>Total Actions</h6>
            <div className="display-6">{stats.totalActions}</div>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card text-center">
          <div className="card-body">
            <h6>Total Errors</h6>
            <div className="display-6 text-danger">{stats.totalErrors}</div>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card text-center">
          <div className="card-body">
            <h6>Last 24h Actions</h6>
            <div className="display-6 text-primary">{stats.last24hActions}</div>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card text-center">
          <div className="card-body">
            <h6>Top Users</h6>
            <Pie data={pieData} />
          </div>
        </div>
      </div>
      <div className="col-12">
        <div className="card">
          <div className="card-body">
            <h6>Actions & Errors Over Time</h6>
            <Bar data={barData} />
          </div>
        </div>
      </div>
    </div>
  );
}
