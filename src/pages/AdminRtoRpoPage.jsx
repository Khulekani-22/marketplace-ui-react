import React, { useEffect, useState } from 'react';
import firestoreService from '../services/firestoreService';

const AdminRtoRpoPage = () => {
  const [recoveryData, setRecoveryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecoveryData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Assume collection name is 'recoveryObjectives'
        const data = await firestoreService.getCollection('recoveryObjectives');
        setRecoveryData(data);
      } catch (err) {
        setError('Failed to fetch recovery data');
      } finally {
        setLoading(false);
      }
    };
    fetchRecoveryData();
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Admin: RTO & Undefined RPO Management</h1>
      <p>Manage Recovery Time Objective (RTO) and Undefined Recovery Point Objective (RPO) with recovery data stored in Firestore.</p>
      {loading ? (
        <p>Loading recovery data...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2rem' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>ID</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>RTO</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>RPO</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Recovery Data</th>
            </tr>
          </thead>
          <tbody>
            {recoveryData.map((item) => (
              <tr key={item.id}>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.id}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.rto ?? 'Undefined'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.rpo ?? 'Undefined'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.recoveryData ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminRtoRpoPage;
