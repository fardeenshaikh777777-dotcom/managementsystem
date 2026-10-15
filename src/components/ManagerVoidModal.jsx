import React, { useState } from 'react';
import { ShieldAlert, KeyRound, X, Check, Delete } from 'lucide-react';
import { verifyManagerPinAndVoid } from '../services/posService';

export function ManagerVoidModal({ orders, onVoidSuccess, onClose }) {
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id || '');
  const [managerPin, setManagerPin] = useState('');
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function appendDigit(digit) {
    if (managerPin.length < 4) {
      setManagerPin(prev => prev + digit);
      setErrorMsg('');
    }
  }

  function backspace() {
    setManagerPin(prev => prev.slice(0, -1));
  }

  async function handleAuthorizeVoid() {
    if (managerPin.length !== 4) {
      setErrorMsg('Please enter a valid 4-digit Manager PIN.');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('A specific cancellation reason is required for security audit.');
      return;
    }
    if (!selectedOrderId) {
      setErrorMsg('Please select an order to void.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyManagerPinAndVoid(selectedOrderId, managerPin, reason);
      onVoidSuccess(selectedOrderId, res);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Invalid Manager PIN. Void rejected!');
      setManagerPin('');
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-window" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header" style={{ background: '#450a0a', borderBottomColor: '#7f1d1d' }}>
          <h3 style={{ color: '#fca5a5' }}>
            <ShieldAlert size={20} color="#ef4444" />
            Anti-Theft Void Guard — Manager Authorization
          </h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', color: '#fca5a5', marginBottom: '14px' }}>
            🔒 <strong>Automation 3 Rule:</strong> Cashiers cannot delete or cancel any generated token/bill without a verified 4-digit Manager PIN (Demo PINs: <strong>7860</strong> or <strong>1234</strong>).
          </div>

          {/* Select Order to Void */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Select Order with Active Token:
            </label>
            {orders.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                No active orders found in current shift to void.
              </div>
            ) : (
              <select
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600
                }}
                value={selectedOrderId}
                onChange={e => setSelectedOrderId(e.target.value)}
              >
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    Token #{o.token} • Rs. {o.total?.toLocaleString()} • {o.items?.length} items ({o.mode})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedOrder && (
            <div style={{ background: 'var(--bg-surface-elevated)', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>
              <div style={{ fontWeight: 700, color: '#fff' }}>
                Order #{selectedOrder.token} Summary:
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                {selectedOrder.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
              </div>
            </div>
          )}

          {/* Cancellation Reason */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Mandatory Void Reason:
            </label>
            <input
              type="text"
              placeholder="e.g., Customer changed mind to Beef Karahi, or wrong table punched"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontSize: '13px'
              }}
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>

          {/* PIN Digits Display */}
          <div style={{ textAlign: 'center', margin: '14px 0' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '6px' }}>
              Enter 4-Digit Manager PIN:
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              {[0, 1, 2, 3].map(idx => (
                <div
                  key={idx}
                  style={{
                    width: '42px',
                    height: '48px',
                    borderRadius: '10px',
                    background: '#04070e',
                    border: '2px solid ' + (managerPin.length > idx ? '#ef4444' : 'var(--border-subtle)'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 900,
                    color: '#ef4444'
                  }}
                >
                  {managerPin.length > idx ? '●' : ''}
                </div>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div style={{ textAlign: 'center', color: '#f87171', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Touch Numpad for PIN */}
          <div className="numpad-grid">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button key={num} type="button" className="numpad-btn" onClick={() => appendDigit(num)}>
                {num}
              </button>
            ))}
            <button
              type="button"
              className="numpad-btn"
              onClick={() => setManagerPin('')}
              style={{ fontSize: '13px', color: 'var(--text-dim)' }}
            >
              Clear
            </button>
            <button key="0" type="button" className="numpad-btn" onClick={() => appendDigit('0')}>
              0
            </button>
            <button type="button" className="numpad-btn" onClick={backspace} style={{ color: '#ef4444' }}>
              <Delete size={20} style={{ display: 'inline' }} />
            </button>
          </div>

          {/* Submit Action */}
          <div style={{ marginTop: '16px' }}>
            <button
              type="button"
              disabled={managerPin.length !== 4 || isSubmitting || !selectedOrderId}
              onClick={handleAuthorizeVoid}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                color: '#fff',
                fontFamily: 'var(--font-display)',
                fontSize: '15px',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: managerPin.length === 4 ? 1 : 0.5
              }}
            >
              <KeyRound size={18} />
              {isSubmitting ? 'Verifying PIN...' : 'Authorize Manager Void & Cancel Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
