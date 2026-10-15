import React, { useState, useEffect } from 'react';
import { Scale, X, Check, Delete } from 'lucide-react';

export function WeightCalculatorModal({ item, initialWeight = 1.0, onConfirm, onClose }) {
  const [weightStr, setWeightStr] = useState(initialWeight ? initialWeight.toString() : '1.0');

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key >= '0' && e.key <= '9') {
        appendChar(e.key);
      } else if (e.key === '.') {
        appendChar('.');
      } else if (e.key === 'Backspace') {
        backspace();
      } else if (e.key === 'Enter') {
        handleConfirm();
      } else if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [weightStr]);

  function appendChar(char) {
    if (char === '.' && weightStr.includes('.')) return;
    if (weightStr === '0' && char !== '.') {
      setWeightStr(char);
    } else {
      setWeightStr(prev => prev + char);
    }
  }

  function backspace() {
    setWeightStr(prev => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  }

  function clear() {
    setWeightStr('0');
  }

  const weightKg = parseFloat(weightStr) || 0;
  const calculatedPrice = Math.round(weightKg * (item?.basePrice || 0));

  function handleConfirm() {
    if (weightKg <= 0) return;
    onConfirm(weightKg, calculatedPrice);
  }

  const PRESETS = [
    { label: '0.5 kg (Half)', val: 0.5 },
    { label: '0.75 kg', val: 0.75 },
    { label: '1.0 kg (1 KG)', val: 1.0 },
    { label: '1.25 kg', val: 1.25 },
    { label: '1.5 kg (Derh)', val: 1.5 },
    { label: '2.0 kg (2 KG)', val: 2.0 }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-window" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <h3>
            <Scale size={20} color="#f59e0b" />
            Live Weight Scale: {item?.name}
          </h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {item?.urduName && (
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-urdu)', fontSize: '15px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              {item.urduName} • نرخ: {item.basePrice} روپے فی کلو
            </div>
          )}

          {/* Rate Notice */}
          <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '12px' }}>
            Base Price: <strong>Rs. {item?.basePrice.toLocaleString()}</strong> per 1.000 KG
          </div>

          {/* Quick Presets Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '14px' }}>
            {PRESETS.map(p => (
              <button
                key={p.val}
                type="button"
                onClick={() => setWeightStr(p.val.toString())}
                style={{
                  padding: '8px 4px',
                  borderRadius: '8px',
                  background: weightKg === p.val ? 'var(--color-brand-primary)' : 'var(--bg-surface-elevated)',
                  color: weightKg === p.val ? '#090d16' : '#fff',
                  fontFamily: 'var(--font-display)',
                  fontSize: '12px',
                  fontWeight: 800,
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Large Touch Digital Display */}
          <div
            style={{
              background: '#04070e',
              border: '2px solid var(--border-accent)',
              borderRadius: '12px',
              padding: '14px',
              textAlign: 'center',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6)'
            }}
          >
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
              Weighed Net Mass (KG)
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', fontWeight: 900, color: '#38bdf8', letterSpacing: '-0.02em' }}>
              {weightStr} <span style={{ fontSize: '20px', color: 'var(--text-muted)' }}>KG</span>
            </div>
            <div style={{ marginTop: '4px', borderTop: '1px solid #1e293b', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Calculated Total:</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 900, color: '#f59e0b' }}>
                Rs. {calculatedPrice.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Touch Numpad */}
          <div className="numpad-grid">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button key={num} type="button" className="numpad-btn" onClick={() => appendChar(num)}>
                {num}
              </button>
            ))}
            <button type="button" className="numpad-btn" onClick={() => appendChar('.')}>
              .
            </button>
            <button key="0" type="button" className="numpad-btn" onClick={() => appendChar('0')}>
              0
            </button>
            <button type="button" className="numpad-btn" onClick={backspace} style={{ color: '#ef4444' }}>
              <Delete size={20} style={{ display: 'inline' }} />
            </button>
          </div>

          {/* Confirm Button */}
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={clear}
              style={{
                flex: '1',
                padding: '12px',
                borderRadius: '10px',
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-muted)',
                fontWeight: 700
              }}
            >
              Reset (C)
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={weightKg <= 0}
              style={{
                flex: '2',
                padding: '12px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#090d16',
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-glow-amber)'
              }}
            >
              <Check size={18} />
              Add Weighed Item to Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
