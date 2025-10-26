import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import './ApiExplorer.css';

const ApiExplorer = () => {
  const [apiKey, setApiKey] = useState('');
  const [apiKeys, setApiKeys] = useState([]);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      
      const response = await fetch('/api/developer/api-keys', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success && data.data.length > 0) {
        setApiKeys(data.data);
        setApiKey(data.data[0].keyPrefix); // Set first key as default
      }
    } catch (error) {
      console.error('Load API keys error:', error);
    }
  };

  const requestInterceptor = (req) => {
    if (apiKey) {
      req.headers['X-API-Key'] = apiKey;
    }
    return req;
  };

  return (
    <div className="api-explorer">
      <div className="explorer-header">
        <h2>API Explorer</h2>
        <div className="api-key-selector">
          <label>Test with API Key:</label>
          <select value={apiKey} onChange={(e) => setApiKey(e.target.value)}>
            <option value="">No API Key</option>
            {apiKeys.map((key) => (
              <option key={key.id} value={key.keyPrefix}>
                {key.name} ({key.keyPrefix}...)
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="swagger-container">
        <SwaggerUI
          url="/openapi.yaml"
          requestInterceptor={requestInterceptor}
          persistAuthorization={true}
        />
      </div>
    </div>
  );
};

export default ApiExplorer;
