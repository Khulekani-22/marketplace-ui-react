import { useState } from "react";
import useReactApexChart from "../../hook/useReactApexChart";
import appData from "../../data/appData.json";

const ETHPriceOne = () => {
  const { createChartSeven } = useReactApexChart();
  const [selectedMonth, setSelectedMonth] = useState("September");

  const leads = appData.leads || [];

  // Filter and summarize lead totals by month
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthlyLeads = months.map((month) => {
    const monthlyTotal = leads
      .filter((lead) => lead.month === month)
      .reduce((sum, lead) => {
        const amount = parseFloat(lead.finalSale?.amount?.replace(/[^\d.]/g, "") || "0");
        return sum + amount;
      }, 0);
    return {
      month,
      total: monthlyTotal
    };
  });

  const categories = monthlyLeads.map((entry) => entry.month);
  const series = monthlyLeads.map((entry) => entry.total);

  return (
    <div className='col-xxl-12 col-md-6'>
      <div className='card h-100'>
        <div className='card-header border-bottom d-flex align-items-center flex-wrap gap-2 justify-content-between'>
          <h6 className='fw-bold text-lg mb-0'>Leads</h6>
          <select
            className='form-select form-select-sm w-auto bg-base border text-secondary-light rounded-pill'
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value='' disabled>
              Select Month
            </option>
            {months.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>
        <div className='card-body'>
          <div
            id='enrollmentChart'
            className='apexcharts-tooltip-style-1 yaxies-more'
          >
            {createChartSeven("#487FFF", categories, series)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ETHPriceOne;
