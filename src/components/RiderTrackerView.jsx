import React, { useState } from 'react';
import { Bike, DollarSign, Clock, Phone, CheckCircle2, UserPlus, AlertCircle, Send, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { recordRiderHandover } from '../services/posService';
import { INITIAL_RIDERS, RIDER_STATUS } from '../data/mockData';
import { BRAND } from '../config/brand';

export function RiderTrackerView({ orders, onUpdateOrders, currency = BRAND.currency }) {
  const [riders, setRiders] = useState(INITIAL_RIDERS);
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger', 'dispatch', 'settle'
  const [selectedRiderForSettlement, setSelectedRiderForSettlement] = useState(null);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [showNewRiderForm, setShowNewRiderForm] = useState(false);
  const [newRiderName, setNewRiderName] = useState('');
  const [newRiderPhone, setNewRiderPhone] = useState('');
  const [newRiderBike, setNewRiderBike] = useState('');

  // Calculate delivery stats per rider
  const deliveryOrders = orders.filter(o => o.mode === 'delivery');

  function getRiderMetrics(rider) {
    const assignedOrders = deliveryOrders.filter(
      o => o.deliveryInfo?.riderId === rider.id || o.deliveryInfo?.riderName?.includes(rider.name.split(' ')[0])
    );
    const dynamicCollected = assignedOrders.reduce(
      (sum, o) => sum + (o.paymentMethod === 'rider_cod' || o.paymentMethod === 'cash' ? o.total : 0),
      0
    );
    const totalCollected = dynamicCollected;
    const surrendered = rider.cashSurrendered || 0;
    const netCashOwed = Math.max(0, totalCollected - surrendered);

    return {
      assignedCount: assignedOrders.length,
      totalCollected,
      cashSurrendered: surrendered,
      netCashOwed
    };
  }

  // Handle cash settlement at shift end
  function handleSettleCash(rider) {
    const metrics = getRiderMetrics(rider);
    setSelectedRiderForSettlement({ rider, metrics });
    setSettlementAmount(metrics.netCashOwed.toString());
  }

  async function confirmSettlement() {
    if (!selectedRiderForSettlement) return;
    const amount = Number(settlementAmount) || 0;
    if (amount <= 0) return;

    try {
      await recordRiderHandover({
        riderId: selectedRiderForSettlement.rider.id,
        amount,
        notes: `Shift settlement for ${selectedRiderForSettlement.rider.name}`
      });
    } catch (e) {
      console.warn('Could not record cash handover in IndexedDB:', e);
    }

    setRiders(prev =>
      prev.map(r => {
        if (r.id === selectedRiderForSettlement.rider.id) {
          return {
            ...r,
            cashSurrendered: (r.cashSurrendered || 0) + amount,
            status: RIDER_STATUS.AVAILABLE
          };
        }
        return r;
      })
    );

    confetti({ particleCount: 60, spread: 50 });
    setSelectedRiderForSettlement(null);
  }

  function handleAddNewRider(e) {
    e.preventDefault();
    if (!newRiderName || !newRiderPhone) return;

    const newR = {
      id: 'r-' + Date.now(),
      name: newRiderName,
      phone: newRiderPhone,
      cnic: '42101-' + Math.floor(1000000 + Math.random() * 9000000) + '-1',
      bikeNo: newRiderBike || 'KHI-7070 (Honda 70)',
      status: 'available',
      cashSurrendered: 0,
      totalTrips: 0
    };

    setRiders(prev => [...prev, newR]);
    setNewRiderName('');
    setNewRiderPhone('');
    setNewRiderBike('');
    setShowNewRiderForm(false);
  }

  // Aggregate totals across all riders
  const allMetrics = riders.map(r => getRiderMetrics(r));
  const totalFleetCollected = allMetrics.reduce((sum, m) => sum + m.totalCollected, 0);
  const totalFleetSurrendered = allMetrics.reduce((sum, m) => sum + m.cashSurrendered, 0);
  const totalFleetPending = allMetrics.reduce((sum, m) => sum + m.netCashOwed, 0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', overflow: 'hidden' }}>
      {/* Top Banner & KPI summary */}
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bike size={22} color="#f59e0b" />
              In-House Delivery Rider Tracker & Cash Ledger
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Karachi Motorbike Fleet Management • Real-time Cash on Delivery (COD) Reconciliation
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowNewRiderForm(prev => !prev)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'var(--bg-surface-elevated)',
              color: '#38bdf8',
              border: '1px solid #0284c7',
              fontWeight: 700,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <UserPlus size={16} />
            {showNewRiderForm ? 'Cancel' : 'Register New Rider'}
          </button>
        </div>

        {/* Fleet KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
              Total COD Cash Collected
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, color: '#38bdf8' }}>
              {currency} {totalFleetCollected.toLocaleString()}
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
              Cash Deposited to Counter
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, color: '#10b981' }}>
              {currency} {totalFleetSurrendered.toLocaleString()}
            </div>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div style={{ fontSize: '11px', color: '#fca5a5', textTransform: 'uppercase', fontWeight: 700 }}>
              Net Cash Owed by Riders
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, color: '#ef4444' }}>
              {currency} {totalFleetPending.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* New Rider Registration Form */}
      {showNewRiderForm && (
        <form onSubmit={handleAddNewRider} style={{ background: '#0f172a', padding: '14px 20px', borderBottom: '1px solid #334155', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Rider Full Name"
            style={{ padding: '8px 12px', borderRadius: '6px', background: '#1e293b', border: '1px solid #475569', color: '#fff', fontSize: '12px' }}
            value={newRiderName}
            onChange={e => setNewRiderName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Mobile No (0300...)"
            style={{ padding: '8px 12px', borderRadius: '6px', background: '#1e293b', border: '1px solid #475569', color: '#fff', fontSize: '12px' }}
            value={newRiderPhone}
            onChange={e => setNewRiderPhone(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Bike Plate (e.g. KHI-8890)"
            style={{ padding: '8px 12px', borderRadius: '6px', background: '#1e293b', border: '1px solid #475569', color: '#fff', fontSize: '12px' }}
            value={newRiderBike}
            onChange={e => setNewRiderBike(e.target.value)}
          />
          <button
            type="submit"
            style={{ padding: '8px 16px', borderRadius: '6px', background: '#10b981', color: '#090d16', fontWeight: 800, fontSize: '12px' }}
          >
            Save Rider
          </button>
        </form>
      )}

      {/* Riders Ledger Cards Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '14px', alignContent: 'start' }}>
        {riders.map(rider => {
          const metrics = getRiderMetrics(rider);
          const isPendingCash = metrics.netCashOwed > 0;

          return (
            <div
              key={rider.id}
              style={{
                background: 'var(--bg-surface)',
                border: isPendingCash ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-subtle)',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div>
                {/* Rider Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'linear-gradient(135deg, #0284c7, #0369a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                      🛵
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', color: '#fff' }}>
                        {rider.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {rider.bikeNo} • {rider.phone}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: rider.status === 'on_delivery' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: rider.status === 'on_delivery' ? '#fbbf24' : '#34d399',
                      border: rider.status === 'on_delivery' ? '1px solid #f59e0b' : '1px solid #10b981'
                    }}
                  >
                    {rider.status === 'on_delivery' ? 'On Delivery 🚀' : 'Available'}
                  </span>
                </div>

                {/* Ledger Breakdown */}
                <div style={{ background: '#04070e', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', margin: '12px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span>Assigned Deliveries:</span>
                    <span style={{ fontWeight: 700, color: '#fff' }}>{metrics.assignedCount} trips</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span>Gross COD Cash Collected:</span>
                    <span style={{ fontWeight: 700, color: '#38bdf8' }}>{currency} {metrics.totalCollected.toLocaleString()}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span>Cash Already Surrendered:</span>
                    <span style={{ fontWeight: 700, color: '#10b981' }}>{currency} {metrics.cashSurrendered.toLocaleString()}</span>
                  </div>

                  <div style={{ borderTop: '1px dashed var(--border-medium)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '13px', color: '#fff' }}>
                      Net Cash Owed to Counter:
                    </span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 900, color: isPendingCash ? '#ef4444' : '#10b981' }}>
                      {isPendingCash ? `${currency} ${metrics.netCashOwed.toLocaleString()}` : 'CLEARED ✓'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Settlement Button */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  disabled={!isPendingCash}
                  onClick={() => handleSettleCash(rider)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: isPendingCash ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--bg-surface-elevated)',
                    color: isPendingCash ? '#fff' : 'var(--text-dim)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <DollarSign size={16} />
                  Settle Cash Deposit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Settle Cash Modal */}
      {selectedRiderForSettlement && (
        <div className="modal-overlay" onClick={() => setSelectedRiderForSettlement(null)}>
          <div className="modal-window" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3>
                <DollarSign size={20} color="#10b981" />
                Settle Rider Cash: {selectedRiderForSettlement.rider.name}
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setSelectedRiderForSettlement(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Rider currently holds <strong>{currency} {selectedRiderForSettlement.metrics.netCashOwed.toLocaleString()}</strong> from COD deliveries. Enter amount surrendered to counter cashier:
              </div>

              <div style={{ background: '#04070e', padding: '14px', borderRadius: '10px', textAlign: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  Cash Amount Surrendering ({currency})
                </div>
                <input
                  type="number"
                  value={settlementAmount}
                  onChange={e => setSettlementAmount(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'center',
                    color: '#10b981',
                    fontFamily: 'var(--font-display)',
                    fontSize: '32px',
                    fontWeight: 900,
                    width: '100%',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSettlementAmount(selectedRiderForSettlement.metrics.netCashOwed.toString())}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'var(--bg-surface-elevated)',
                    color: '#fbbf24',
                    fontWeight: 700,
                    fontSize: '12px'
                  }}
                >
                  Full Clear ({currency} {selectedRiderForSettlement.metrics.netCashOwed.toLocaleString()})
                </button>
                <button
                  type="button"
                  onClick={confirmSettlement}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: '#10b981',
                    color: '#090d16',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 900,
                    fontSize: '13px'
                  }}
                >
                  Confirm Deposit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
