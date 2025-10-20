import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Card, Row, Col, Spinner, Toast } from 'react-bootstrap';

interface PaymentModalProps {
  show: boolean;
  onHide: () => void;
  userId: string;
  userBalance: { credits: number; zar: number };
}

const paymentTiles = [
  { key: 'voucher', label: 'Voucher (Coupon)', icon: '🎟️' },
  { key: 'credits', label: 'Kumii Credits', icon: '💰' },
  { key: 'sponsored', label: 'Sponsored', icon: '🤝' },
  { key: 'card', label: 'Card/EFT (Coming Soon)', icon: '💳', disabled: true },
];

const sponsoredGroupsList = [
  // fallback if API fails
  { id: 'aws', name: 'AWS Cohort' },
  { id: 'ms', name: 'Microsoft Cohort' },
  { id: 'ab', name: 'African Bank Cohort' },
];

const PaymentModal: React.FC<PaymentModalProps> = ({ show, onHide, userId, userBalance }) => {
  const [selected, setSelected] = useState<string>('credits');
  const [loading, setLoading] = useState(false);
  const [sponsoredGroups, setSponsoredGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [toast, setToast] = useState<{ show: boolean; message: string; variant: 'success' | 'danger' }>({ show: false, message: '', variant: 'success' });

  useEffect(() => {
    if (selected === 'sponsored') {
      setLoading(true);
      axios.get('/api/payments/sponsored-groups', { params: { userId } })
        .then(res => setSponsoredGroups(res.data.groups || sponsoredGroupsList))
        .catch(() => setSponsoredGroups(sponsoredGroupsList))
        .finally(() => setLoading(false));
    }
  }, [selected, userId]);

  const handleTileSelect = (key: string) => {
    setSelected(key);
    setSelectedGroup('');
  };

  const handleAction = async () => {
    setLoading(true);
    try {
      let res;
      if (selected === 'voucher') {
        // Prompt for voucher code (could use a modal input in real app)
        const code = prompt('Enter voucher code:');
        if (!code) throw new Error('Voucher code required');
        res = await axios.post('/api/payments/redeem-voucher', { userId, code });
      } else if (selected === 'credits') {
        res = await axios.post('/api/payments/pay-with-credits', { userId });
      } else if (selected === 'sponsored') {
        if (!selectedGroup) throw new Error('Select a sponsorship group');
        res = await axios.post('/api/payments/apply-sponsorship', { userId, groupId: selectedGroup });
      }
      setToast({ show: true, message: res?.data?.message || 'Payment successful!', variant: 'success' });
      setTimeout(() => { setToast({ ...toast, show: false }); onHide(); }, 1500);
    } catch (err: any) {
      setToast({ show: true, message: err?.response?.data?.error || err.message || 'Payment failed', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const actionLabel = selected === 'voucher' ? 'Redeem Voucher' : selected === 'credits' ? 'Pay with Kumii Credits' : selected === 'sponsored' ? 'Apply Sponsorship' : 'Coming Soon';

  return (
    <Modal show={show} onHide={onHide} aria-labelledby="payment-options-title" centered>
      <Modal.Header closeButton>
        <Modal.Title id="payment-options-title">Payment Options</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <strong>Final Balance:</strong> {userBalance.credits} Kumii Credits &nbsp;|&nbsp; R{userBalance.zar}
        </div>
        <Row xs={2} md={4} className="g-2 mb-3" role="listbox" aria-label="Payment Methods">
          {paymentTiles.map(tile => (
            <Col key={tile.key}>
              <Card
                className={`h-100 text-center payment-tile ${selected === tile.key ? 'border-primary' : ''}`}
                tabIndex={tile.disabled ? -1 : 0}
                aria-selected={selected === tile.key}
                aria-disabled={tile.disabled}
                role="option"
                onClick={() => !tile.disabled && handleTileSelect(tile.key)}
                onKeyDown={e => !tile.disabled && (e.key === 'Enter' || e.key === ' ') && handleTileSelect(tile.key)}
                style={{ cursor: tile.disabled ? 'not-allowed' : 'pointer', opacity: tile.disabled ? 0.5 : 1 }}
              >
                <Card.Body>
                  <div style={{ fontSize: 32 }}>{tile.icon}</div>
                  <div>{tile.label}</div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
        {selected === 'sponsored' && (
          <div className="mb-3">
            <label htmlFor="sponsored-group-select" className="form-label">Select Programme / User Group</label>
            {loading ? <Spinner animation="border" size="sm" /> : (
              <select
                id="sponsored-group-select"
                className="form-select"
                value={selectedGroup}
                onChange={e => setSelectedGroup(e.target.value)}
                aria-label="Select sponsorship group"
              >
                <option value="">Choose...</option>
                {sponsoredGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="primary"
          onClick={handleAction}
          disabled={loading || (selected === 'sponsored' && !selectedGroup) || selected === 'card'}
          aria-disabled={loading || (selected === 'sponsored' && !selectedGroup) || selected === 'card'}
        >
          {loading ? <Spinner animation="border" size="sm" /> : actionLabel}
        </Button>
      </Modal.Footer>
      <Toast
        show={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
        bg={toast.variant}
        delay={2000}
        autohide
        style={{ position: 'absolute', top: 10, right: 10, zIndex: 9999 }}
        role="status"
        aria-live="polite"
      >
        <Toast.Body>{toast.message}</Toast.Body>
      </Toast>
    </Modal>
  );
};

export default PaymentModal;
