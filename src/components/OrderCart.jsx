import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  UtensilsCrossed,
  ShoppingBag,
  Car,
  Bike,
  Edit3,
  CreditCard,
  Banknote,
  Truck,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { RIDERS_LIST } from '../data/mockData';
import { BRAND } from '../config/brand';

const QUICK_TABLES = [
  'T-01', 'T-02', 'T-03', 'T-04',
  'T-05', 'T-06', 'T-07', 'T-08',
  'Hall-1', 'Hall-2', 'Family-1', 'VIP-1'
];

export function OrderCart({
  orderMode = 'takeaway',
  setOrderMode,
  onChangeOrderMode,
  dailyToken,
  tokenNumber,
  tableNumber = '',
  setTableNumber,
  onChangeTableNumber,
  carDetails = '',
  setCarDetails,
  onChangeCarDetails,
  deliveryInfo = {},
  setDeliveryInfo,
  onChangeDeliveryInfo,
  cartItems = [],
  onUpdateQty,
  onRemoveItem,
  onOpenWeightModalForEdit,
  onClearCart,
  srbTaxRate = 0,
  setSrbTaxRate,
  onChangeTaxRate,
  onInitiateCheckout,
  onResetDemo,
  currency = BRAND.currency
}) {
  const [showFullTableGrid, setShowFullTableGrid] = useState(false);

  const modeSetter = setOrderMode || onChangeOrderMode || (() => {});
  const activeToken = tokenNumber || dailyToken || 1;
  const tableSetter = setTableNumber || onChangeTableNumber || (() => {});
  const carSetter = setCarDetails || onChangeCarDetails || (() => {});
  const deliverySetter = setDeliveryInfo || onChangeDeliveryInfo || (() => {});
  const taxSetter = setSrbTaxRate || onChangeTaxRate || (() => {});

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + (item.totalPrice || 0), 0);
  const totalItemCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const tax = Math.round((subtotal * srbTaxRate) / 100);
  const total = subtotal + tax;

  return (
    <div className="pos-order-cart-container">
      {/* 1. Header: Mode Segmented Switcher & Contextual Meta */}
      <div className="cart-header-section">
        <div className="order-mode-segmented-control" role="tablist" aria-label="Order Mode">
          <button
            type="button"
            role="tab"
            aria-selected={orderMode === 'takeaway'}
            className={`mode-segment-btn ${orderMode === 'takeaway' ? 'active takeaway' : ''}`}
            onClick={() => modeSetter('takeaway')}
          >
            <ShoppingBag size={16} />
            <span>Takeaway</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={orderMode === 'dine_in'}
            className={`mode-segment-btn ${orderMode === 'dine_in' ? 'active dine-in' : ''}`}
            onClick={() => modeSetter('dine_in')}
          >
            <UtensilsCrossed size={16} />
            <span>Dine-In</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={orderMode === 'car_dine'}
            className={`mode-segment-btn ${orderMode === 'car_dine' ? 'active car-dine' : ''}`}
            onClick={() => modeSetter('car_dine')}
          >
            <Car size={16} />
            <span>Car-Dine</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={orderMode === 'delivery'}
            className={`mode-segment-btn ${orderMode === 'delivery' ? 'active delivery' : ''}`}
            onClick={() => modeSetter('delivery')}
          >
            <Bike size={16} />
            <span>Delivery</span>
          </button>
        </div>

        {/* Dynamic Mode Metadata Container */}
        <div className="mode-context-banner">
          <div className="token-pill-badge" title="Daily running token sequence">
            <span className="token-label">TOKEN</span>
            <span className="token-number">#{String(activeToken).padStart(3, '0')}</span>
          </div>

          <div className="mode-context-details">
            {orderMode === 'takeaway' && (
              <div className="takeaway-status-info">
                <span className="takeaway-highlight">Counter Express</span>
                <span className="takeaway-sub">Self-pickup token</span>
              </div>
            )}

            {orderMode === 'dine_in' && (
              <div className="dine-in-picker-summary">
                <input
                  type="text"
                  className="mode-inline-input"
                  placeholder="Select table below or type..."
                  value={tableNumber}
                  onChange={e => tableSetter(e.target.value)}
                  aria-label="Table number"
                />
                <button
                  type="button"
                  className="table-toggle-btn"
                  onClick={() => setShowFullTableGrid(prev => !prev)}
                  title="Toggle Table Grid"
                >
                  {showFullTableGrid ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            )}

            {orderMode === 'car_dine' && (
              <input
                type="text"
                className="mode-inline-input car-input"
                placeholder="Car No & Color (e.g. LEA-4921 White Corolla)"
                value={carDetails}
                onChange={e => carSetter(e.target.value)}
                aria-label="Car details"
              />
            )}

            {orderMode === 'delivery' && (
              <select
                className="mode-inline-select"
                value={deliveryInfo?.riderId || ''}
                onChange={e => deliverySetter({ ...deliveryInfo, riderId: e.target.value })}
                aria-label="Select delivery rider"
              >
                <option value="">Select Rider...</option>
                {RIDERS_LIST.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.phone})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Clean Table Picker Grid (Shown for Dine-In mode) */}
        {orderMode === 'dine_in' && (
          <div className={`table-picker-grid-wrapper ${showFullTableGrid ? 'expanded' : ''}`}>
            <div className="table-picker-grid">
              {QUICK_TABLES.map(table => {
                const isSelected = tableNumber === table;
                return (
                  <button
                    key={table}
                    type="button"
                    className={`table-chip-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => tableSetter(table)}
                  >
                    {table}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Items List / Empty State */}
      <div className="cart-items-scroll">
        {cartItems.length === 0 ? (
          <div className="cart-empty-placeholder">
            <div className="empty-cloche-art">
              <UtensilsCrossed size={44} className="empty-cloche-icon" />
              <div className="empty-cloche-ring" />
            </div>
            <div className="empty-cart-text">
              <h4 className="empty-cart-title">Order Cart is Empty</h4>
              <p className="empty-cart-subtitle">
                Tap any dish on the menu grid to add it to this bill.
              </p>
            </div>
            <div className="empty-cart-shortcuts">
              <span className="shortcut-tag"><kbd>F1</kbd> Cash Pay</span>
              <span className="shortcut-tag"><kbd>F2</kbd> Card</span>
              <span className="shortcut-tag"><kbd>F4</kbd> Void</span>
            </div>
          </div>
        ) : (
          <div className="cart-items-list">
            <div className="cart-items-meta-header">
              <span>Items ({totalItemCount})</span>
              <span>Price</span>
            </div>

            {cartItems.map((item, index) => (
              <div key={`${item.id}-${index}`} className="cart-item-card">
                <div className="cart-item-info-row">
                  <div className="cart-item-titles">
                    <span className="cart-item-en-name">{item.name}</span>
                    {item.urduName && (
                      <span className="cart-item-urdu-name" dir="rtl">{item.urduName}</span>
                    )}
                  </div>
                  <div className="cart-item-subtotal-block">
                    <span className="cart-item-subtotal">
                      {currency} {(item.totalPrice || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="cart-item-controls-row">
                  {item.weightKg ? (
                    <button
                      type="button"
                      className="cart-weight-badge"
                      onClick={() => onOpenWeightModalForEdit && onOpenWeightModalForEdit(item, index)}
                      title="Adjust Scale Weight"
                    >
                      <span className="weight-scale-icon">⚖️</span>
                      <span className="weight-val">{item.weightKg.toFixed(3)} kg</span>
                      <span className="weight-rate">@{currency} {item.unitPrice || item.basePrice}/kg</span>
                      <Edit3 size={11} className="weight-edit-icon" />
                    </button>
                  ) : (
                    <div className="touch-qty-stepper">
                      <button
                        type="button"
                        className="qty-stepper-btn minus"
                        onClick={() => onUpdateQty && onUpdateQty(index, -1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={15} />
                      </button>
                      <span className="qty-stepper-val">{item.quantity}</span>
                      <button
                        type="button"
                        className="qty-stepper-btn plus"
                        onClick={() => onUpdateQty && onUpdateQty(index, 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    className="cart-delete-item-btn"
                    onClick={() => onRemoveItem && onRemoveItem(index)}
                    aria-label={`Remove ${item.name} from bill`}
                    title="Remove Item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Sticky Totals & Big Pay Buttons Footer */}
      <div className="cart-footer-sticky">
        {/* Bill Summary Table */}
        <div className="bill-summary-card">
          <div className="bill-calc-row">
            <span className="calc-label">Subtotal</span>
            <span className="calc-value">{currency} {subtotal.toLocaleString()}</span>
          </div>

          <div className="bill-calc-row tax-row">
            <span className="calc-label">
              Sindh Sales Tax (SRB)
              <button
                type="button"
                className={`tax-toggle-pill ${srbTaxRate > 0 ? 'active' : ''}`}
                onClick={() => taxSetter(srbTaxRate === 0 ? 5 : 0)}
                title="Toggle SRB Sales Tax Rate"
              >
                {srbTaxRate}%
              </button>
            </span>
            <span className="calc-value">{currency} {tax.toLocaleString()}</span>
          </div>

          <div className="bill-calc-row total-row">
            <div className="total-title-block">
              <span className="total-main-label">NET PAYABLE</span>
              <span className="total-tax-status">
                {srbTaxRate > 0 ? 'Tax Inclusive' : 'Zero-Rated / Tax Free'}
              </span>
            </div>
            <div className="total-value-block">
              <span className="total-currency">{currency}</span>
              <span className="total-number">{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Big Sticky Checkout Actions Grid */}
        <div className="sticky-pay-actions-grid">
          <button
            type="button"
            className="big-pay-btn primary-cash"
            disabled={cartItems.length === 0}
            onClick={() => onInitiateCheckout && onInitiateCheckout('cash')}
          >
            <div className="pay-btn-content">
              <div className="pay-btn-main">
                <Banknote size={20} className="pay-icon" />
                <span className="pay-title">CASH PAY</span>
              </div>
              <span className="pay-hotkey-badge">F1</span>
            </div>
          </button>

          <button
            type="button"
            className="pay-btn secondary-card"
            disabled={cartItems.length === 0}
            onClick={() => onInitiateCheckout && onInitiateCheckout('card')}
          >
            <CreditCard size={18} />
            <span className="pay-sub-label">CARD</span>
            <span className="hotkey-mini">F2</span>
          </button>

          <button
            type="button"
            className="pay-btn secondary-cod"
            disabled={cartItems.length === 0}
            onClick={() => onInitiateCheckout && onInitiateCheckout('rider_cod')}
          >
            <Truck size={18} />
            <span className="pay-sub-label">COD</span>
            <span className="hotkey-mini">F3</span>
          </button>
        </div>

        {/* Footer Utility Links */}
        <div className="cart-utility-links">
          {cartItems.length > 0 && (
            <button
              type="button"
              className="clear-bill-link"
              onClick={onClearCart}
            >
              Clear Current Bill
            </button>
          )}

          {onResetDemo && (
            <button
              type="button"
              className="reset-demo-link"
              onClick={onResetDemo}
              title="Reset orders and cash drawers for a pristine client demonstration"
            >
              <RotateCcw size={11} style={{ display: 'inline', marginRight: '4px' }} />
              Reset Demo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderCart;
