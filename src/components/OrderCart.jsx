import React from 'react';
import { Trash2, Plus, Minus, UtensilsCrossed, ShoppingBag, Car, Bike, Edit3 } from 'lucide-react';
import { RIDERS_LIST } from '../data/mockData';

export function OrderCart({
  orderMode,
  setOrderMode,
  tokenNumber,
  tableNumber,
  setTableNumber,
  carDetails,
  setCarDetails,
  deliveryInfo,
  setDeliveryInfo,
  cartItems,
  onUpdateQty,
  onRemoveItem,
  onOpenWeightModalForEdit,
  onClearCart,
  srbTaxRate,
  setSrbTaxRate,
  onInitiateCheckout
}) {
  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.totalPrice, 0);
  const tax = Math.round((subtotal * srbTaxRate) / 100);
  const total = subtotal + tax;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top: Order Modes & Meta */}
      <div className="cart-header">
        <div className="order-modes-toggle-grid">
          <button
            type="button"
            className={`mode-btn ${orderMode === 'dine_in' ? 'active' : ''}`}
            onClick={() => setOrderMode('dine_in')}
          >
            <UtensilsCrossed size={16} />
            <span>Dine-In</span>
          </button>

          <button
            type="button"
            className={`mode-btn ${orderMode === 'takeaway' ? 'active takeaway' : ''}`}
            onClick={() => setOrderMode('takeaway')}
          >
            <ShoppingBag size={16} />
            <span>Takeaway</span>
          </button>

          <button
            type="button"
            className={`mode-btn ${orderMode === 'car_dine' ? 'active car-dine' : ''}`}
            onClick={() => setOrderMode('car_dine')}
          >
            <Car size={16} />
            <span>Car-Dine</span>
          </button>

          <button
            type="button"
            className={`mode-btn ${orderMode === 'delivery' ? 'active' : ''}`}
            onClick={() => setOrderMode('delivery')}
          >
            <Bike size={16} />
            <span>Delivery</span>
          </button>
        </div>

        {/* Dynamic Mode Metadata Input Row */}
        <div className="mode-meta-row">
          <span className="token-pill-badge" title="Daily token sequence starting from #1 each morning">
            #{tokenNumber.toString().padStart(3, '0')}
          </span>

          {orderMode === 'dine_in' && (
            <input
              type="text"
              className="mode-input-field"
              placeholder="Table No (e.g., T-04 or Family Hall)"
              value={tableNumber}
              onChange={e => setTableNumber(e.target.value)}
            />
          )}

          {orderMode === 'takeaway' && (
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#f59e0b', paddingLeft: '4px' }}>
              Counter Token Pickup
            </div>
          )}

          {orderMode === 'car_dine' && (
            <input
              type="text"
              className="mode-input-field"
              placeholder="Car / Bike No & Model (e.g. LEA-4921 Corolla White)"
              value={carDetails}
              onChange={e => setCarDetails(e.target.value)}
            />
          )}

          {orderMode === 'delivery' && (
            <select
              className="mode-input-field"
              style={{ background: 'var(--bg-surface-elevated)', color: '#fff', padding: '4px' }}
              value={deliveryInfo.riderId || ''}
              onChange={e => setDeliveryInfo({ ...deliveryInfo, riderId: e.target.value })}
            >
              <option value="">Select Delivery Rider...</option>
              {RIDERS_LIST.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="cart-items-scroll">
        {cartItems.length === 0 ? (
          <div className="cart-empty-placeholder">
            <UtensilsCrossed size={42} style={{ opacity: 0.3 }} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: '#e2e8f0' }}>
                Active Bill is Empty
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                Tap any dish on the left touch grid to punch into bill
              </p>
            </div>
          </div>
        ) : (
          cartItems.map((item, index) => (
            <div key={`${item.id}-${index}`} className="cart-item-row">
              <div className="cart-item-top">
                <div>
                  <div className="cart-item-title">{item.name}</div>
                  {item.urduName && (
                    <div className="cart-item-urdu">{item.urduName}</div>
                  )}
                </div>
                <div className="cart-item-subtotal">
                  Rs. {item.totalPrice.toLocaleString()}
                </div>
              </div>

              <div className="cart-item-controls">
                {item.weightKg ? (
                  <div
                    className="weight-indicator-badge"
                    onClick={() => onOpenWeightModalForEdit(item, index)}
                    title="Click to adjust weight"
                  >
                    ⚖️ {item.weightKg.toFixed(3)} kg @ Rs. {item.basePrice}/kg
                    <Edit3 size={10} style={{ display: 'inline', marginLeft: '4px' }} />
                  </div>
                ) : (
                  <div className="qty-counter-group">
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => onUpdateQty(index, -1)}
                    >
                      <Minus size={12} />
                    </button>
                    <span className="qty-num">{item.quantity}</span>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => onUpdateQty(index, 1)}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  className="del-item-btn"
                  onClick={() => onRemoveItem(index)}
                  title="Remove Item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & 1-Click Checkout Footer */}
      <div className="cart-footer">
        <div className="bill-summary-table">
          <div className="bill-row">
            <span>Items Subtotal:</span>
            <span>Rs. {subtotal.toLocaleString()}</span>
          </div>

          <div className="bill-row" style={{ alignItems: 'center' }}>
            <span>
              Sindh Sales Tax (SRB):
              <button
                type="button"
                onClick={() => setSrbTaxRate(srbTaxRate === 0 ? 5 : 0)}
                style={{
                  marginLeft: '6px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: srbTaxRate > 0 ? '#3b82f6' : 'var(--bg-surface-elevated)',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 700
                }}
              >
                {srbTaxRate}%
              </button>
            </span>
            <span>Rs. {tax.toLocaleString()}</span>
          </div>

          <div className="bill-row total-row">
            <span>NET TOTAL:</span>
            <span className="total-amount">Rs. {total.toLocaleString()}</span>
          </div>
        </div>

        {/* 1-Click Checkout Buttons */}
        <div className="checkout-actions-grid">
          <button
            type="button"
            className="checkout-btn cash"
            disabled={cartItems.length === 0}
            onClick={() => onInitiateCheckout('cash')}
          >
            <span>CASH PAY</span>
            <span className="key-hint">Press F1</span>
          </button>

          <button
            type="button"
            className="checkout-btn card"
            disabled={cartItems.length === 0}
            onClick={() => onInitiateCheckout('card')}
          >
            <span>CARD</span>
            <span className="key-hint">F2</span>
          </button>

          <button
            type="button"
            className="checkout-btn rider"
            disabled={cartItems.length === 0}
            onClick={() => onInitiateCheckout('rider_cod')}
          >
            <span>COD</span>
            <span className="key-hint">F3</span>
          </button>
        </div>

        {cartItems.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClearCart}
              style={{
                background: 'transparent',
                color: 'var(--text-dim)',
                fontSize: '11px',
                fontWeight: 600,
                textDecoration: 'underline'
              }}
            >
              Clear Current Bill
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
