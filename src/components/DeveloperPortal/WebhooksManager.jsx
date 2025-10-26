import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase';
import './WebhooksManager.css';

const WEBHOOK_EVENTS = [
  'service.created', 'service.updated', 'service.deleted',
  'vendor.created', 'vendor.updated', 'vendor.deleted',
  'subscription.created', 'subscription.updated', 'subscription.cancelled',
  'message.created', 'message.updated', 'message.deleted',
  'transaction.created', 'transaction.updated', 'transaction.completed', 'transaction.failed',
  'user.created', 'user.updated'
];

const WebhooksManager = () => {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [showDeliveriesModal, setShowDeliveriesModal] = useState(false);
  const [deliveries, setDeliveries] = useState([]);
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    events: [],
    secret: ''
  });

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      
      const response = await fetch('/api/developer/webhooks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setWebhooks(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Load webhooks error:', error);
      setLoading(false);
    }
  };

  const createWebhook = async () => {
    if (!newWebhook.url || newWebhook.events.length === 0) {
      alert('Please provide URL and select at least one event');
      return;
    }

    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newWebhook)
      });

      const data = await response.json();
      if (data.success) {
        alert('Webhook created successfully!');
        setShowCreateModal(false);
        setNewWebhook({ url: '', events: [], secret: '' });
        loadWebhooks();
      } else {
        alert('Failed to create webhook: ' + data.message);
      }
    } catch (error) {
      console.error('Create webhook error:', error);
      alert('Error creating webhook');
    }
  };

  const deleteWebhook = async (webhookId) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        loadWebhooks();
      } else {
        alert('Failed to delete webhook');
      }
    } catch (error) {
      console.error('Delete webhook error:', error);
    }
  };

  const testWebhook = async (webhookId) => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/webhooks/${webhookId}/test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        alert('Test webhook sent! Check your endpoint.');
      } else {
        alert('Failed to send test webhook');
      }
    } catch (error) {
      console.error('Test webhook error:', error);
    }
  };

  const viewDeliveries = async (webhook) => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/developer/webhooks/${webhook.id}/deliveries`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setDeliveries(data.data);
        setSelectedWebhook(webhook);
        setShowDeliveriesModal(true);
      }
    } catch (error) {
      console.error('Load deliveries error:', error);
    }
  };

  const toggleEvent = (event) => {
    if (newWebhook.events.includes(event)) {
      setNewWebhook({
        ...newWebhook,
        events: newWebhook.events.filter(e => e !== event)
      });
    } else {
      setNewWebhook({
        ...newWebhook,
        events: [...newWebhook.events, event]
      });
    }
  };

  if (loading) {
    return <div className="loading">Loading webhooks...</div>;
  }

  return (
    <div className="webhooks-manager">
      <div className="webhooks-header">
        <h2>Webhooks</h2>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          Create Webhook
        </button>
      </div>

      {webhooks.length === 0 ? (
        <div className="empty-state">
          <p>No webhooks configured yet</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            Create Your First Webhook
          </button>
        </div>
      ) : (
        <div className="webhooks-list">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="webhook-card">
              <div className="webhook-header">
                <h3>{webhook.url}</h3>
                <span className={`status-badge ${webhook.active ? 'status-active' : 'status-inactive'}`}>
                  {webhook.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="webhook-stats">
                <div className="stat">
                  <label>Events</label>
                  <value>{webhook.events.length}</value>
                </div>
                <div className="stat">
                  <label>Last Delivery</label>
                  <value>
                    {webhook.lastDelivery?.timestamp
                      ? new Date(webhook.lastDelivery.timestamp).toLocaleString()
                      : 'Never'}
                  </value>
                </div>
                <div className="stat">
                  <label>Status</label>
                  <value>
                    {webhook.lastDelivery?.success ? '✓ Success' : '✗ Failed'}
                  </value>
                </div>
              </div>

              <div className="webhook-events">
                <label>Subscribed Events:</label>
                <div className="event-tags">
                  {webhook.events.map((event) => (
                    <span key={event} className="event-tag">{event}</span>
                  ))}
                </div>
              </div>

              <div className="webhook-actions">
                <button onClick={() => viewDeliveries(webhook)} className="btn-secondary">
                  View Deliveries
                </button>
                <button onClick={() => testWebhook(webhook.id)} className="btn-secondary">
                  Send Test
                </button>
                <button onClick={() => deleteWebhook(webhook.id)} className="btn-danger">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create Webhook</h2>
            
            <div className="form-group">
              <label>Webhook URL</label>
              <input
                type="url"
                placeholder="https://your-api.com/webhooks"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Secret (Optional - for HMAC signature verification)</label>
              <input
                type="password"
                placeholder="Leave empty to auto-generate"
                value={newWebhook.secret}
                onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Select Events ({newWebhook.events.length} selected)</label>
              <div className="events-checklist">
                {WEBHOOK_EVENTS.map((event) => (
                  <label key={event} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newWebhook.events.includes(event)}
                      onChange={() => toggleEvent(event)}
                    />
                    <span>{event}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={createWebhook}
                className="btn-primary"
                disabled={!newWebhook.url || newWebhook.events.length === 0}
              >
                Create Webhook
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeliveriesModal && selectedWebhook && (
        <div className="modal-overlay" onClick={() => setShowDeliveriesModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <h2>Delivery History - {selectedWebhook.url}</h2>
            
            {deliveries.length === 0 ? (
              <p>No deliveries yet</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Event</th>
                    <th>Status</th>
                    <th>Response Time</th>
                    <th>Attempt</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((delivery, i) => (
                    <tr key={i}>
                      <td>{new Date(delivery.timestamp).toLocaleString()}</td>
                      <td><code>{delivery.event}</code></td>
                      <td>
                        <span className={`status-badge ${delivery.success ? 'status-success' : 'status-failed'}`}>
                          {delivery.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td>{delivery.responseTime}ms</td>
                      <td>{delivery.attempt}/3</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="modal-actions">
              <button onClick={() => setShowDeliveriesModal(false)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhooksManager;
