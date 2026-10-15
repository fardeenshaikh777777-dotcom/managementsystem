import React, { useState, useEffect } from 'react';
import { DollarSign, CreditCard, Bike, Printer, X, Check } from 'lucide-react';

export function PaymentModal({
  totalAmount,
  initialMethod = 'cash',
  tokenNumber,
  onCompletePayment,
  onClose
}) {
  const [method, setMethod] = useState(initialMethod);
  const [tenderedAmount, setTenderedAmount] = useState(totalAmount);

  useEffect(() => {
    setTenderedAmount(totalAmount);
  }, [totalAmount]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'F1') {
        setMethod('cash');
      } else if (e.key === 'F2') {
        setMethod('card');
      } else if (e.key === 'F3') {
        setMethod('rider_cod');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tenderedAmount, method]);

  const changeDue = Math.max(0, tenderedAmount - totalAmount);

  function addTender(amount) {
    setTenderedAmount(prev => prev + amount);
  }

  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      onCompletePayment({
        method,
        tendered: method === 'cash' ? tenderedAmount : totalAmount,
        change: method === 'cash' ? changeDue : 0
      });
    } catch (err) {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-window" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3>
            <DollarSign size={20} color="#10b981" />
            Checkout & Tender — Token #{tokenNumber.toString().padStart(3, '0')}
          </h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Method Selector Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setMethod('cash')}
              style={{
                padding: '12px 8px',
                borderRadius: '10px',
                background: method === 'cash' ? '#10b981' : 'var(--bg-surface-elevated)',
                color: method === 'cash' ? '#fff' : 'var(--text-muted)',
                fontWeight: 800,
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <DollarSign size={18} />
              <span>Cash Pay (F1)</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('card')}
              style={{
                padding: '12px 8px',
                borderRadius: '10px',
                background: method === 'card' ? '#3b82f6' : 'var(--bg-surface-elevated)',
                color: method === 'card' ? '#fff' : 'var(--text-muted)',
                fontWeight: 800,
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <CreditCard size={18} />
              <span>Card Pay (F2)</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('rider_cod')}
              style={{
                padding: '12px 8px',
                borderRadius: '10px',
                background: method === 'rider_cod' ? '#f59e0b' : 'var(--bg-surface-elevated)',
                color: method === 'rider_cod' ? '#090d16' : 'var(--text-muted)',
                fontWeight: 800,
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Bike size={18} />
              <span>Rider COD (F3)</span>
            </button>
          </div>

          {/* Amount Due Box */}
          <div
            style={{
              background: '#04070e',
              border: '1px solid var(--border-medium)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              marginBottom: '16px'
            }}
          >
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
              Total Payable Amount
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '38px', fontWeight: 900, color: '#f59e0b' }}>
              Rs. {totalAmount.toLocaleString()}
            </div>
          </div>

          {/* Cash Tender & Change Calculator */}
          {method === 'cash' && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                Quick Pakistani Note Tender:
              </div>

              {/* Note Preset Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '14px' }}>
                <button
                  type="button"
                  onClick={() => setTenderedAmount(totalAmount)}
                  style={{
                    padding: '10px 4px',
                    borderRadius: '8px',
                    background: tenderedAmount === totalAmount ? 'var(--color-brand-primary)' : 'var(--bg-surface-elevated)',
                    color: tenderedAmount === totalAmount ? '#090d16' : '#fff',
                    fontWeight: 800,
                    fontSize: '11px',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  Exact (Rs. {totalAmount})
                </button>

                <button
                  type="button"
                  onClick={() => addTender(500)}
                  style={{
                    padding: '10px 4px',
                    borderRadius: '8px',
                    background: 'var(--bg-surface-elevated)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '12px',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  +Rs. 500
                </button>

                <button
                  type="button"
                  onClick={() => addTender(1000)}
                  style={{
                    padding: '10px 4px',
                    borderRadius: '8px',
                    background: 'var(--bg-surface-elevated)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '12px',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  +Rs. 1,000
                </button>

                <button
                  type="button"
                  onClick={() => setTenderedAmount(Math.ceil(totalAmount / 5000) * 5000 || 5000)}
                  style={{
                    padding: '10px 4px',
                    borderRadius: '8px',
                    background: 'var(--bg-surface-elevated)',
                    color: '#fbbf24',
                    fontWeight: 800,
                    fontSize: '12px',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  Rs. 5,000 Note
                </button>
              </div>

              {/* Tendered vs Change Display */}
              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Cash Received:</div>
                  <input
                    type="number"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontFamily: 'var(--font-display)',
                      fontSize: '20px',
                      fontWeight: 800,
                      width: '120px',
                      outline: 'none'
                    }}
                    value={tenderedAmount}
                    onChange={e => setTenderedAmount(Number(e.target.value) || 0)}
                  />
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Change Return:</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, color: changeDue > 0 ? '#10b981' : '#94a3b8' }}>
                    Rs. {changeDue.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Confirm & Thermal Print Button */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '12px',
              background: isSubmitting ? '#475569' : 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              fontFamily: 'var(--font-display)',
              fontSize: '16px',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: isSubmitting ? 'none' : 'var(--shadow-glow-emerald)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            <Printer size={20} />
            <span>{isSubmitting ? 'Recording & Securing...' : 'Confirm & Print 80mm Receipt (Enter)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
