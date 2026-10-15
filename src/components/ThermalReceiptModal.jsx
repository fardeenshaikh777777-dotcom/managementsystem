import React, { useState } from 'react';
import { Printer, CheckCircle2, X, Send, Copy, Check, MessageSquare } from 'lucide-react';
import { getWhatsAppReceiptUrl, generateWhatsAppReceiptText } from '../utils/whatsappReceipt';

export function ThermalReceiptModal({ order, onClose, isReprint = false }) {
  const [customerPhone, setCustomerPhone] = useState(order?.customerPhone || '0300');
  const [copied, setCopied] = useState(false);
  const [paperWidth, setPaperWidth] = useState('80mm'); // '80mm' | '58mm'

  if (!order) return null;

  function handleDirectPrint() {
    window.print();
  }

  function handleSendWhatsApp() {
    const url = getWhatsAppReceiptUrl(customerPhone, order);
    window.open(url, '_blank');
  }

  function handleCopyText() {
    const text = generateWhatsAppReceiptText(order);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Filter items for specialized tear-off slips
  const tandoorItems = (order.items || []).filter(i => 
    i.station === 'Tandoor Oven' || i.name.toLowerCase().includes('naan') || i.name.toLowerCase().includes('paratha')
  );

  const kitchenItems = (order.items || []).filter(i => 
    i.station !== 'Tandoor Oven' && !i.name.toLowerCase().includes('naan')
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-window" onClick={e => e.stopPropagation()} style={{ maxWidth: paperWidth === '58mm' ? '380px' : '460px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={20} color="#10b981" />
            <h3 style={{ margin: 0 }}>
              Order #{order.token} {isReprint ? '(Reprint)' : 'Paid'}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* 80mm vs 58mm Paper Toggle */}
            <div style={{ display: 'flex', background: '#090d16', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: paperWidth === '80mm' ? '#10b981' : 'transparent',
                  color: paperWidth === '80mm' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                80mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: paperWidth === '58mm' ? '#10b981' : 'transparent',
                  color: paperWidth === '58mm' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                58mm
              </button>
            </div>

            <button type="button" className="modal-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
          {/* =================================================================== */}
          {/* WHATSAPP RECEIPT AUTOMATION SECTION                                 */}
          {/* =================================================================== */}
          <div
            style={{
              background: 'linear-gradient(135deg, #064e3b, #022c22)',
              border: '1px solid #059669',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '14px',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <MessageSquare size={18} color="#34d399" />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '13px', color: '#6ee7b7' }}>
                WhatsApp Digital Receipt Automation
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Pakistani Phone (e.g., 0300-1234567)"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                style={{
                  flex: 1,
                  padding: '9px 10px',
                  borderRadius: '8px',
                  background: '#04070e',
                  border: '1px solid #10b981',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={handleSendWhatsApp}
                style={{
                  padding: '9px 14px',
                  borderRadius: '8px',
                  background: '#25D366',
                  color: '#062612',
                  fontWeight: 900,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Send pre-filled WhatsApp bill link"
              >
                <Send size={14} />
                Send WA
              </button>
              <button
                type="button"
                onClick={handleCopyText}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Copy receipt text to clipboard"
              >
                {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div style={{ fontSize: '10px', color: '#a7f3d0', marginTop: '4px' }}>
              🌿 Paperless billing: Generates pre-filled WhatsApp message with itemized breakdown.
            </div>
          </div>

          {/* =================================================================== */}
          {/* PRINTABLE THERMAL RECEIPT (80MM / 58MM ADAPTIVE)                     */}
          {/* =================================================================== */}
          <div
            className="thermal-receipt-container print-only-area"
            style={{
              maxWidth: paperWidth === '58mm' ? '270px' : '360px',
              margin: '0 auto',
              fontSize: paperWidth === '58mm' ? '11px' : '12px'
            }}
          >
            {isReprint && (
              <div style={{ border: '2px dashed #000', padding: '4px', margin: '6px 0', textAlign: 'center', fontWeight: 900, fontSize: '11px' }}>
                *** REPRINT / DUPLICATE COPY ***
              </div>
            )}

            {/* Header */}
            <div className="thermal-center thermal-bold" style={{ fontSize: paperWidth === '58mm' ? '13px' : '15px' }}>
              🔥 KARACHI SHINWARI & BROAST
            </div>
            <div className="thermal-center" style={{ fontSize: '10px' }}>
              Highway & Burns Road • Karachi
            </div>
            <div className="thermal-center" style={{ fontSize: '9px' }}>
              NTN: 8920194-2 • SRB Reg: 15-00-9821-001
            </div>
            <div className="thermal-center" style={{ fontSize: '10px' }}>
              Ph: 021-34981024 / 0300-9284719
            </div>

            {/* Giant Token Box */}
            <div className="thermal-token-box">
              TOKEN #{String(order.token).padStart(3, '0')}
            </div>

            {/* Order Meta */}
            <div className="thermal-divider" />
            <div className="thermal-table-row">
              <span>Date: {new Date(order.createdAt).toLocaleDateString()}</span>
              <span>Time: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="thermal-table-row thermal-bold">
              <span>Order Type: {order.mode?.toUpperCase()}</span>
              <span>{order.paymentMethod?.toUpperCase()}</span>
            </div>

            {order.mode === 'dine_in' && (
              <div className="thermal-table-row thermal-bold">
                <span>TABLE: {order.tableNo || 'Walk-in'}</span>
              </div>
            )}

            {order.mode === 'car_dine' && (
              <div className="thermal-table-row thermal-bold" style={{ background: '#eee', padding: '2px' }}>
                <span>CAR: {order.carDetails || 'General Parking'}</span>
              </div>
            )}

            {order.mode === 'delivery' && (
              <div style={{ fontSize: '10px' }}>
                <div>Rider: {order.deliveryInfo?.riderName || 'In-House Fleet'}</div>
              </div>
            )}

            <div className="thermal-divider" />

            {/* Itemized Table */}
            <div className="thermal-table-row thermal-bold" style={{ fontSize: '11px' }}>
              <span>ITEM / QTY</span>
              <span>AMOUNT</span>
            </div>
            <div className="thermal-divider" />

            {order.items.map((item, idx) => (
              <div key={idx} style={{ margin: '4px 0' }}>
                <div className="thermal-table-row">
                  <span className="thermal-bold">
                    {item.quantity}x {item.name}
                  </span>
                  <span>Rs. {item.totalPrice.toLocaleString()}</span>
                </div>
                {item.weightKg && (
                  <div style={{ fontSize: '10px', color: '#444', paddingLeft: '8px' }}>
                    (Weighed: {item.weightKg.toFixed(3)} kg @ Rs. {item.basePrice}/kg)
                  </div>
                )}
                {item.urduName && (
                  <div style={{ fontSize: '10px', textAlign: 'right', color: '#444' }}>
                    {item.urduName}
                  </div>
                )}
              </div>
            ))}

            <div className="thermal-divider" />

            {/* Totals */}
            <div className="thermal-table-row">
              <span>Subtotal:</span>
              <span>Rs. {order.subtotal?.toLocaleString()}</span>
            </div>
            <div className="thermal-table-row">
              <span>Sindh Tax (SRB):</span>
              <span>Rs. {order.tax?.toLocaleString()}</span>
            </div>
            <div className="thermal-table-row thermal-bold" style={{ fontSize: '14px', marginTop: '4px' }}>
              <span>TOTAL PAID:</span>
              <span>Rs. {order.total?.toLocaleString()}</span>
            </div>

            {order.paymentMethod === 'cash' && (
              <>
                <div className="thermal-table-row" style={{ fontSize: '10px' }}>
                  <span>Cash Tendered:</span>
                  <span>Rs. {order.tendered?.toLocaleString()}</span>
                </div>
                <div className="thermal-table-row thermal-bold" style={{ fontSize: '11px' }}>
                  <span>Change Returned:</span>
                  <span>Rs. {order.change?.toLocaleString()}</span>
                </div>
              </>
            )}

            <div className="thermal-center" style={{ marginTop: '10px', fontSize: '10px' }}>
              *** Shukriya! Visit Again ***
            </div>

            {/* TEAR-OFF SLIP 1: MAIN KITCHEN KOT */}
            <div className="tear-off-slip">
              <div className="thermal-center thermal-bold" style={{ fontSize: '13px' }}>
                🍗 KITCHEN ORDER TICKET (KOT)
              </div>
              <div className="thermal-center thermal-bold" style={{ fontSize: '16px', margin: '4px 0' }}>
                TOKEN #{order.token.toString().padStart(3, '0')} • {order.mode?.toUpperCase()}
              </div>
              {order.mode === 'car_dine' && (
                <div className="thermal-center thermal-bold" style={{ fontSize: '11px' }}>
                  CAR: {order.carDetails}
                </div>
              )}
              {order.mode === 'dine_in' && (
                <div className="thermal-center thermal-bold" style={{ fontSize: '11px' }}>
                  TABLE: {order.tableNo}
                </div>
              )}
              <div className="thermal-divider" />
              {kitchenItems.map((item, idx) => (
                <div key={idx} className="thermal-table-row thermal-bold">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{item.weightKg ? `${item.weightKg.toFixed(3)} KG` : item.station}</span>
                </div>
              ))}
            </div>

            {/* TEAR-OFF SLIP 2: TANDOOR SLIP */}
            {tandoorItems.length > 0 && (
              <div className="tear-off-slip">
                <div className="thermal-center thermal-bold" style={{ fontSize: '13px' }}>
                  🫓 TANDOOR NAAN SLIP
                </div>
                <div className="thermal-center thermal-bold" style={{ fontSize: '16px', margin: '4px 0' }}>
                  TOKEN #{order.token.toString().padStart(3, '0')} • {order.mode?.toUpperCase()}
                </div>
                <div className="thermal-divider" />
                {tandoorItems.map((item, idx) => (
                  <div key={idx} className="thermal-table-row thermal-bold" style={{ fontSize: '13px' }}>
                    <span>{item.quantity}x {item.name} ({item.urduName})</span>
                    <span>TANDOOR</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handleDirectPrint}
              style={{
                flex: 2,
                padding: '14px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                fontWeight: 900,
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Printer size={18} />
              Print 80mm Slip (Ctrl+P)
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '10px',
                background: 'var(--bg-surface-elevated)',
                color: '#fff',
                fontWeight: 700
              }}
            >
              Done / Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
