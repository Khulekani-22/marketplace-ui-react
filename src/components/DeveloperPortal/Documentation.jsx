import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase';
import './Documentation.css';

const Documentation = () => {
  const [docs, setDocs] = useState(null);
  const [activeGuide, setActiveGuide] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDocumentation();
  }, []);

  const loadDocumentation = async () => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      
      const response = await fetch('/api/developer/documentation', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setDocs(data.data);
      }
    } catch (error) {
      console.error('Load documentation error:', error);
    }
  };

  const filteredGuides = docs?.guides?.filter(guide =>
    guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guide.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (!docs) {
    return <div className="loading">Loading documentation...</div>;
  }

  return (
    <div className="documentation">
      <div className="docs-header">
        <h2>API Documentation</h2>
        <input
          type="search"
          placeholder="Search documentation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="docs-content">
        <div className="docs-sidebar">
          <div className="sidebar-section">
            <h3>Getting Started</h3>
            <ul>
              {filteredGuides.slice(0, 3).map((guide, i) => (
                <li key={i}>
                  <a
                    href={guide.url}
                    className={activeGuide === guide.url ? 'active' : ''}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveGuide(guide.url);
                    }}
                  >
                    {guide.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="sidebar-section">
            <h3>Advanced Topics</h3>
            <ul>
              {filteredGuides.slice(3).map((guide, i) => (
                <li key={i}>
                  <a
                    href={guide.url}
                    className={activeGuide === guide.url ? 'active' : ''}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveGuide(guide.url);
                    }}
                  >
                    {guide.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="sidebar-section">
            <h3>API References</h3>
            <ul>
              <li>
                <a href={docs.openapi} target="_blank" rel="noopener noreferrer">
                  OpenAPI Specification
                </a>
              </li>
              <li>
                <a href={docs.postman} target="_blank" rel="noopener noreferrer">
                  Postman Collection
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="docs-main">
          {!activeGuide ? (
            <>
              <div className="welcome-section">
                <h1>Welcome to the API Documentation</h1>
                <p>
                  Our comprehensive API documentation will help you integrate with our platform quickly and easily.
                  Choose a guide from the sidebar to get started, or explore the sections below.
                </p>
              </div>

              <div className="quick-links">
                <h2>Quick Links</h2>
                <div className="links-grid">
                  <a href={docs.openapi} target="_blank" rel="noopener noreferrer" className="link-card">
                    <h3>📄 OpenAPI Spec</h3>
                    <p>Complete API reference in OpenAPI format</p>
                  </a>
                  <a href={docs.postman} target="_blank" rel="noopener noreferrer" className="link-card">
                    <h3>📮 Postman Collection</h3>
                    <p>Import and test APIs in Postman</p>
                  </a>
                </div>
              </div>

              <div className="guides-section">
                <h2>Guides</h2>
                <div className="guides-grid">
                  {docs.guides.map((guide, i) => (
                    <div key={i} className="guide-card">
                      <h3>{guide.title}</h3>
                      <p>{guide.description}</p>
                      <a
                        href={guide.url}
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveGuide(guide.url);
                        }}
                      >
                        Read Guide →
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sdks-section">
                <h2>SDKs</h2>
                <div className="sdks-grid">
                  {docs.sdks.map((sdk, i) => (
                    <div key={i} className="sdk-card">
                      <h3>{sdk.language}</h3>
                      <p>Official {sdk.language} SDK</p>
                      <code className="install-command">{sdk.install}</code>
                      <a href={sdk.docs} target="_blank" rel="noopener noreferrer">
                        View SDK Docs →
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="guide-content">
              <button onClick={() => setActiveGuide(null)} className="back-button">
                ← Back to Overview
              </button>
              <iframe
                src={activeGuide}
                title="Guide Content"
                className="guide-iframe"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Documentation;
