import React, { useEffect, useState } from 'react';
import { getAppData } from '../utils/loadData';

const AllDataTable = () => {
  const [data, setData] = useState({});

  useEffect(() => {
    setData(getAppData());
  }, []);

  const renderTable = (title, records) => {
    if (!records || records.length === 0) return null;

    const keys = Object.keys(records[0]);

    return (
      <div className="mb-5">
        <h4 className="mb-3">{title}</h4>
        <div className="table-responsive border rounded">
          <table className="table table-sm table-striped table-hover">
            <thead className="table-dark">
              <tr>
                {keys.map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((record, idx) => (
                <tr key={idx}>
                  {keys.map((key) => (
                    <td key={key}>
                      {typeof record[key] === 'object'
                        ? JSON.stringify(record[key], null, 2)
                        : record[key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="container py-5">
      <h2 className="mb-4">All App Data</h2>
      {Object.entries(data).map(([section, records]) =>
        renderTable(section.charAt(0).toUpperCase() + section.slice(1), records)
      )}
    </div>
  );
};

export default AllDataTable;
