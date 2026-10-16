import React, { useState } from 'react';
import { Lock, Calculator, CheckCircle2, AlertTriangle, X, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { executeBlindShiftClose } from '../services/posService';
import { BRAND } from '../config/brand';

export function BlindCashCloseModal({ activeShift, onShiftClosed, onClose, currency = BRAND.currency }) {
  const [notes, setNotes] = useState({
    '5000': '',
    '1000': '',
    '500': '',
    '100': '',
    '75': '',
    '50': '',
    '20': '',
    '10': '',
    'coins': ''
  });
  const [reason, setReason] = useState('');
  const [closingReport, setClosingReport] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleNoteChange(denom, val) {
    const num = val.replace(/[^0-9]/g, '');
    setNotes(prev => ({ ...prev, [denom]: num }));
  }

  // Calculate live counted cash total
  const countedTotal =
    (Number(notes['5000']) || 0) * 5000 +
    (Number(notes['1000']) || 0) * 1000 +
    (Number(notes['500']) || 0) * 500 +
    (Number(notes['100']) || 0) * 100 +
    (Number(notes['75']) || 0) * 75 +
    (Number(notes['50']) || 0) * 50 +
    (Number(notes['20']) || 0) * 20 +
    (Number(notes['10']) || 0) * 10 +
    (Number(notes['coins']) || 0) * 1;

  async function handleSubmitBlindClosing() {
    setIsSubmitting(true);
    try {
      const report = await executeBlindShiftClose(notes, reason);
      setClosingReport(report);
      onShiftClosed(report);

      if (report.isBalanced) {
        confetti({ particleCount: 80, spread: 60 });
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const DENOMS = [
    { key: '5000', label: `${currency} 5,000 Notes`, mult: 5000, color: '#f59e0b' },
    { key: '1000', label: `${currency} 1,000 Notes`, mult: 1000, color: '#3b82f6' },
    { key: '500', label: `${currency} 500 Notes`, mult: 500, color: '#10b981' },
    { key: '100', label: `${currency} 100 Notes`, mult: 100, color: '#ec4899' },
    { key: '75', label: `${currency} 75 Note`, mult: 75, color: '#8b5cf6' },
    { key: '50', label: `${currency} 50 Notes`, mult: 50, color: '#14b8a6' },
    { key: '20', label: `${currency} 20 Notes`, mult: 20, color: '#f97316' },
    { key: '10', label: `${currency} 10 Notes`, mult: 10, color: '#84cc16' },
    { key: 'coins', label: `Loose Coins / Change (${currency})`, mult: 1, color: '#94a3b8' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-window" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="modal-header" style={{ background: '#1e293b' }}>
          <h3>
            <Lock size={20} color="#f59e0b" />
            Automation 4: Blind Cash Shift Closing
          </h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {!closingReport ? (
            <>
              {/* Blind Closing Policy Notice */}
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: '#fbbf24',
                  marginBottom: '16px'
                }}
              >
                🔒 <strong>Blind Closing Security:</strong> System sales totals are strictly hidden from the cashier. You must count physical cash in the drawer and enter denomination note quantities below. The database will calculate expected cash and log any discrepancy.
              </div>

              {/* Denomination Input Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '42vh', overflowY: 'auto', paddingRight: '4px' }}>
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
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '190px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color }} />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>{d.label}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0 pcs"
                          value={notes[d.key]}
                          onChange={e => handleNoteChange(d.key, e.target.value)}
                          style={{
                            width: '80px',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-medium)',
                            color: 'var(--text-main)',
                            fontFamily: 'var(--font-display)',
                            fontSize: '14px',
                            fontWeight: 700,
                            textAlign: 'center'
                          }}
                        />
                        <div style={{ width: '100px', textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 800, color: rowSubtotal > 0 ? '#38bdf8' : 'var(--text-dim)' }}>
                          {currency} {rowSubtotal.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Counted Total Banner */}
              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '2px solid var(--border-accent)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '16px'
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
                    Total Counted Physical Cash
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    System totals will reveal after submit
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 900, color: '#10b981' }}>
                  {currency} {countedTotal.toLocaleString()}
                </div>
              </div>

              {/* Discrepancy Note */}
              <div style={{ marginTop: '12px' }}>
                <input
                  type="text"
                  placeholder="Optional note / reason if you suspect any petty coin shortage..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
              </div>

              {/* Submit & Lock Button */}
              <div style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitBlindClosing}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#090d16',
                    fontFamily: 'var(--font-display)',
                    fontSize: '15px',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Lock size={18} />
                  Submit Blind Count & Permanently Lock Shift
                </button>
              </div>
            </>
          ) : (
            /* Shift Closing Audit Report (Revealed after submission) */
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: closingReport.isShortage ? '#450a0a' : '#064e3b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                {closingReport.isShortage ? (
                  <AlertTriangle size={32} color="#ef4444" />
                ) : (
                  <ShieldCheck size={32} color="#10b981" />
                )}
              </div>

              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 900, color: 'var(--text-main)', marginBottom: '6px' }}>
                Shift #{closingReport.sessionNumber || 104} Closed & Locked
              </h2>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
                {closingReport.message}
              </div>

              {/* Breakdown Table */}
              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <span>Opening Cash Float:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{currency} {closingReport.openingCash?.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <span>System Paid Cash Sales:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{currency} {closingReport.cashSalesTotal?.toLocaleString()}</span>
                </div>
                <div style={{ borderTop: '1px dashed var(--border-medium)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700 }}>
                  <span>Calculated Expected Cash:</span>
                  <span style={{ color: 'var(--color-blue, #2563eb)' }}>{currency} {closingReport.expectedCashTotal?.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700 }}>
                  <span>Your Counted Physical Cash:</span>
                  <span style={{ color: 'var(--color-emerald, #059669)' }}>{currency} {closingReport.physicalCashTotal?.toLocaleString()}</span>
                </div>

                <div
                  style={{
                    borderTop: '2px solid var(--border-bright)',
                    paddingTop: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontWeight: 900, fontSize: '15px' }}>
                    {closingReport.isShortage ? 'CASH SHORTAGE:' : closingReport.isOverage ? 'CASH OVERAGE:' : 'STATUS:'}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '22px',
                      fontWeight: 900,
                      color: closingReport.isShortage ? '#ef4444' : closingReport.isOverage ? '#f59e0b' : '#10b981'
                    }}
                  >
                    {closingReport.isBalanced
                      ? 'PERFECTLY BALANCED'
                      : `${currency} ${Math.abs(closingReport.cashDiscrepancy).toLocaleString()}`}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'var(--bg-surface-elevated)',
                    color: '#fff',
                    fontWeight: 700
                  }}
                >
                  Close & Switch Shift
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
