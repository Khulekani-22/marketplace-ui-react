import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import React, { useState } from "react";
import ReactApexChart from "react-apexcharts";
import useReactApexChart from "../../hook/useReactApexChart";
import { useAppSync } from "../../context/useAppSync";

// Chart.js setup
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const StatisticsOne = () => {
  const { appData } = useAppSync();
  
  // Prepare app data
  const leads = appData?.leads || [];
  const services = appData?.services || [];

  // Group by year
  const leadsByYear = leads.reduce((acc, lead) => {
    const year = new Date(lead?.date || "2024-01-01").getFullYear();
    const amount = parseFloat(lead?.finalSale?.amount?.replace(/[^\d.]/g, "") || "0");
    acc[year] = (acc[year] || 0) + amount;
    return acc;
  }, {});

  // Group by service/vendor
  const leadsByService = leads.reduce((acc, lead) => {
    const owner = lead.owner || "Unknown";
    const amount = parseFloat(lead?.finalSale?.amount?.replace(/[^\d.]/g, "") || "0");
    acc[owner] = (acc[owner] || 0) + amount;
    return acc;
  }, {});

const StatisticsOne = () => {
  const {
    dailyIconBarChartSeriesTwo,
    dailyIconBarChartOptionsTwo,
    createChartEight,
  } = useReactApexChart();

  const [activeTab, setActiveTab] = useState("year");

  // Chart.js options
  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: activeTab === "year" ? "Earnings by Year" : "Earnings by Service",
      },
    },
  };

  const labels = activeTab === "year"
    ? Object.keys(leadsByYear)
    : Object.keys(leadsByService);

  const dataValues = activeTab === "year"
    ? Object.values(leadsByYear)
    : Object.values(leadsByService);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Rands",
        data: dataValues,
        backgroundColor: "rgba(53, 162, 235, 0.5)",
      },
    ],
  };

  const totalArtSold = services.filter(service =>
    service.category?.toLowerCase().includes("art")
  ).length;

  const totalEarnings = leads.reduce((sum, lead) => {
    const amount = parseFloat(lead.finalSale?.amount?.replace(/[^\d.]/g, "") || "0");
    return sum + amount;
  }, 0);

  return (
    <div className='col-xxl-12 col-md-6'>
      <div className='card h-100'>
        <div className='card-header border-bottom d-flex align-items-center flex-wrap gap-2 justify-content-between'>
          <h6 className='fw-bold text-lg mb-0'>Statistics</h6>
          <Link
            to='#'
            className='text-primary-600 hover-text-primary d-flex align-items-center gap-1'
          >
            View All
            <Icon icon='solar:alt-arrow-right-linear' className='icon' />
          </Link>
        </div>

        <div className='card-body'>
          <div className='d-flex align-items-center justify-content-between mb-20'>
            <ul className='nav nav-tabs gap-2'>
              <li className='nav-item'>
                <button
                  className={`nav-link fw-semibold px-12 py-6 rounded-pill ${activeTab === "year" ? "active btn-primary-600 text-white" : "btn-outline-primary"}`}
                  onClick={() => setActiveTab("year")}
                >
                  By Year
                </button>
              </li>
              <li className='nav-item'>
                <button
                  className={`nav-link fw-semibold px-12 py-6 rounded-pill ${activeTab === "service" ? "active btn-primary-600 text-white" : "btn-outline-primary"}`}
                  onClick={() => setActiveTab("service")}
                >
                  By Service
                </button>
              </li>
            </ul>
          </div>

          <div className='d-flex align-items-center gap-1 justify-content-between mb-44'>
            <div>
              <h5 className='fw-semibold mb-12'>{totalArtSold}</h5>
              <span className='text-secondary-light fw-normal text-xl'>
                Total Art Sold
              </span>
            </div>
            <ReactApexChart
              id='dailyIconBarChart'
              options={dailyIconBarChartOptionsTwo}
              series={dailyIconBarChartSeriesTwo}
              type='bar'
              height={80}
              width={164}
            />
          </div>

          <div className='d-flex align-items-center gap-1 justify-content-between mb-44'>
            <div>
              <h5 className='fw-semibold mb-12'>R {totalEarnings.toFixed(2)}</h5>
              <span className='text-secondary-light fw-normal text-xl'>
                Total Earnings
              </span>
            </div>
            <div id='areaChart'>
              {createChartEight("#FF9F29")}
            </div>
          </div>

          <div className='d-flex align-items-center justify-content-center mt-5'>
            <Bar options={options} data={chartData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsOne;
