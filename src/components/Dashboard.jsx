import React, { useEffect, useState } from 'react';
import { getAppData } from '../utils/loadData';

const Dashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const { bookings, cohorts, events } = getAppData();
    setBookings(bookings);
    setCohorts(cohorts);
    setEvents(events);
  }, []);

  return (
    <div className="container py-4">
      <h2 className="mb-4">Bookings</h2>
      <ul className="list-group mb-5">
        {bookings.map(b => (
          <li key={b.id} className="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <strong>{b.serviceTitle}</strong><br />
              by {b.customerName} | Vendor: {b.vendorName}
            </div>
            <span className="badge bg-primary">R {b.price}</span>
          </li>
        ))}
      </ul>

      <h2 className="mb-4">Upcoming Events</h2>
      <ul className="list-group mb-5">
        {events.map(e => (
          <li key={e.id} className="list-group-item">
            <strong>{e.title}</strong> - {new Date(e.date).toLocaleDateString()}
            <div className="text-muted">{e.host}</div>
          </li>
        ))}
      </ul>

      <h2 className="mb-4">Cohorts</h2>
      <ul className="list-group">
        {cohorts.map(c => (
          <li key={c.id} className="list-group-item">
            {c.name} - {c.courses.length} modules
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
