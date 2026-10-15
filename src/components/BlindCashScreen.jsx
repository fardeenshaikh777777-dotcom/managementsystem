import React, { useState } from 'react';
import { Lock, Calculator, CheckCircle2, AlertTriangle, Printer, RotateCcw, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { executeBlindShiftClose } from '../services/posService';

export function BlindCashScreen({ activeShift, onShiftClosed, onSwitchToPos }) {
  const [notes, setNotes] = useState({
    '5000': '',
    '1000': '',
    '500': '',
    '100': '',
    '50': '',
    '20': '',
    '10': '',
    'coins': ''
  });
  const [reason, setReason] = useState('');
  const [report, setReport] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleNoteChange(denom, val) {
    const num = val.replace(/[^0-9]/g, '');
    setNotes(prev => ({ ...prev, [denom]: num }));
  }

  // Live counted cash sum
  const physicalTotal =
    (Number(notes['5000']) || 0) * 5000 +
    (Number(notes['1000']) || 0) * 1000 +
    (Number(notes['500']) || 0) * 500 +
    (Number(notes['100']) || 0) * 100 +
    (Number(notes['50']) || 0) * 50 +
    (Number(notes['20']) || 0) * 20 +
    (Number(notes['10']) || 0) * 10 +
    (Number(notes['coins']) || 0) * 1;

  async function handleLockShift() {
    setIsSubmitting(true);
    try {
      const res = await executeBlindShiftClose(notes, reason);
      setReport(res);
      onShiftClosed(res);

      if (res.isBalanced) {
        confetti({ particleCount: 90, spread: 70 });
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const DENOMS = [
    { key: '5000', label: 'Rs. 5,000 Note', mult: 5000, color: '#f59e0b', tag: 'High Denom' },
    { key: '1000', label: 'Rs. 1,000 Note', mult: 1000, color: '#3b82f6', tag: 'Standard' },
    { key: '500', label: 'Rs. 500 Note', mult: 500, color: '#10b981', tag: 'Standard' },
    { key: '100', label: 'Rs. 100 Note', mult: 100, color: '#ec4899', tag: 'Common' },
    { key: '50', label: 'Rs. 50 Note', mult: 50, color: '#14b8a6', tag: 'Small Note' },
    { key: '20', label: 'Rs. 20 Note', mult: 20, color: '#f97316', tag: 'Small Note' },
    { key: '10', label: 'Rs. 10 Note', mult: 10, color: '#84cc16', tag: 'Small Note' },
    { key: 'coins', label: 'Loose Coins / Change', mult: 1, color: '#94a3b8', tag: 'Coins PKR' }
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', overflowY: 'auto', padding: '24px 32px' }}>
      <div style={{ maxWidth: '860px', width: '100%', margin: '0 auto' }}>
        {/* Screen Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Lock size={26} color="#f59e0b" />
              Blind Cash Drawer Closing Screen
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Shift #{activeShift?.sessionNumber || 104} • Cashier: {activeShift?.cashierName || 'Asad Ullah'} • Terminal: {activeShift?.terminalId || 'POS-01'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onSwitchToPos}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'var(--bg-surface-elevated)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '12px'
              }}
            >
              Back to POS
            </button>
          </div>
        </div>

        {!report ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
            {/* Left: Currency Note Denomination Inputs */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '20px', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                  Pakistani Rupee Note Breakdown
                </h3>
                <span style={{ fontSize: '11px', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  Blind Mode Active
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {DENOMS.map(d => {
                  const count = Number(notes[d.key]) || 0;
                  const rowSubtotal = count * d.mult;

                  return (
                    <div
                      key={d.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--bg-surface-elevated)',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '14px', color: '#fff' }}>{d.label}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Multiplier: × {d.mult.toLocaleString()}</div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0 pcs"
                          value={notes[d.key]}
                          onChange={e => handleNoteChange(d.key, e.target.value)}
                          style={{
                            width: '90px',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            background: '#04070e',
                            border: '1px solid var(--border-medium)',
                            color: '#fff',
                            fontFamily: 'var(--font-display)',
                            fontSize: '16px',
                            fontWeight: 800,
                            textAlign: 'center'
                          }}
                        />
                        <div style={{ width: '110px', textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 900, color: rowSubtotal > 0 ? '#38bdf8' : 'var(--text-dim)' }}>
                          Rs. {rowSubtotal.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Security Rules & Live Count Sum */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Security Policy Card */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '18px' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 800, color: '#f59e0b', marginBottom: '8px' }}>
                  🔒 Anti-Theft Blind Closing Rule
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Under Karachi Express POS security protocols, shift totals are not shown to counter staff until the physical cash count is locked into the database. This prevents cashiers from adjusting note counts to match register numbers.
                </p>
                <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', fontSize: '12px', color: 'var(--text-dim)' }}>
                  Opening Float: <strong>Rs. {activeShift?.openingCash?.toLocaleString() || '5,000'}</strong>
                </div>
              </div>

              {/* Live Counted Box */}
              <div style={{ background: '#04070e', border: '2px solid var(--border-accent)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
                  Total Counted Physical Cash
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', fontWeight: 900, color: '#10b981', margin: '4px 0' }}>
                  Rs. {physicalTotal.toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  System will calculate expected cash upon submission
                </div>
              </div>

              {/* Optional Explanation Input */}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Cashier Shift Note (Optional):
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Small coin difference, rider handed over Rs. 200 in loose coins"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Submit & Lock Button */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleLockShift}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#090d16',
                  fontFamily: 'var(--font-display)',
                  fontSize: '16px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: 'var(--shadow-glow-amber)'
                }}
              >
                <Lock size={18} />
                {isSubmitting ? 'Calculating & Locking...' : 'Submit Blind Count & Lock Shift'}
              </button>
            </div>
          </div>
        ) : (
          /* Shift Closing Audit Report */
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: '20px', padding: '32px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: report.isShortage ? '#450a0a' : '#064e3b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              {report.isShortage ? <AlertTriangle size={36} color="#ef4444" /> : <ShieldCheck size={36} color="#10b981" />}
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, color: '#fff', marginBottom: '6px' }}>
              Shift Session Locked & Reconciled
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              {report.message}
            </p>

            <div style={{ background: '#04070e', borderRadius: '14px', padding: '20px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)' }}>
                <span>Opening Cash Float:</span>
                <span style={{ fontWeight: 700, color: '#fff' }}>Rs. {report.openingCash?.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)' }}>
                <span>Paid Cash Sales (Shift Total):</span>
                <span style={{ fontWeight: 700, color: '#fff' }}>Rs. {report.cashSalesTotal?.toLocaleString()}</span>
              </div>
              <div style={{ borderTop: '1px dashed var(--border-medium)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 800 }}>
                <span>System Expected Cash:</span>
                <span style={{ color: '#38bdf8' }}>Rs. {report.expectedCashTotal?.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 800 }}>
                <span>Physical Cash Counted:</span>
                <span style={{ color: '#10b981' }}>Rs. {report.physicalCashTotal?.toLocaleString()}</span>
              </div>

              <div style={{ borderTop: '2px solid var(--border-bright)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 900, fontSize: '16px' }}>
                  {report.isShortage ? 'DISCREPANCY (SHORTAGE):' : report.isOverage ? 'DISCREPANCY (OVERAGE):' : 'DISCREPANCY:'}
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 900, color: report.isShortage ? '#ef4444' : report.isOverage ? '#f59e0b' : '#10b981' }}>
                  {report.isBalanced ? 'BALANCED (Rs. 0)' : `Rs. ${Math.abs(report.cashDiscrepancy).toLocaleString()}`}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'var(--bg-surface-elevated)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Printer size={16} />
                Print Shift Audit Z-Report
              </button>
              <button
                type="button"
                onClick={onSwitchToPos}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '10px',
                  background: '#10b981',
                  color: '#090d16',
                  fontWeight: 900,
                  fontSize: '14px'
                }}
              >
                New Shift / Return
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
