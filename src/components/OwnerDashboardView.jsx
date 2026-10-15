import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Utensils, 
  Flame, 
  ShieldAlert, 
  AlertTriangle, 
  Smartphone, 
  Monitor, 
  CheckCircle2, 
  Clock, 
  Scale, 
  RefreshCw 
} from 'lucide-react';

export function OwnerDashboardView({ orders, menuItems, activeShift }) {
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  // Compute live owner analytics
  const completedOrders = orders.filter(o => o.status === 'completed');
  const voidedOrders = orders.filter(o => o.status === 'cancelled' || o.isVoided);

  // Revenue metrics
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0) + 24800; // Adding base day sales
  const cashRevenue = completedOrders
    .filter(o => o.paymentMethod === 'cash')
    .reduce((sum, o) => sum + (o.total || 0), 0) + 16500;
  const cardRevenue = completedOrders
    .filter(o => o.paymentMethod === 'card')
    .reduce((sum, o) => sum + (o.total || 0), 0) + 5300;
  const codRevenue = completedOrders
    .filter(o => o.paymentMethod === 'rider_cod')
    .reduce((sum, o) => sum + (o.total || 0), 0) + 3000;

  // Active open dine-in tables
  const activeTables = [
    { tableNo: 'T-04 (Main Hall)', guests: 4, amount: 2530, duration: '28m', status: 'Dining' },
    { tableNo: 'T-07 (Family Room)', guests: 6, amount: 4890, duration: '45m', status: 'Served' },
    { tableNo: 'T-12 (Courtyard)', guests: 2, amount: 1360, duration: '12m', status: 'Cooking' }
  ];

  // Top selling items
  const topDishes = [
    { name: 'Quarter Chicken Broast', urdu: 'کوآرٹر چکن بروسٹ', count: 54, sales: 36720, station: 'Fryer' },
    { name: 'Special Beef Nalli Biryani', urdu: 'اسپیشل بیف نلی بریانی', count: 38, sales: 19760, station: 'Daigh' },
    { name: 'Chicken Shinwari Karahi', urdu: 'شنواری چکن کڑاہی', count: '24.5 kg', sales: 45325, station: 'Karahi' },
    { name: 'Peshawari Chapli Kabab', urdu: 'پشاوری چپلی کباب', count: 32, sales: 15360, station: 'BBQ' },
    { name: 'Special Roghni Naan', urdu: 'روغنی نان', count: 118, sales: 10620, station: 'Tandoor' },
    { name: 'Doodh Patti Karak Chai', urdu: 'دودھ پتی کڑک چائے', count: 85, sales: 11900, station: 'Chai' }
  ];

  // Inventory & Daigh Status
  const daighItems = menuItems.filter(i => i.isDaighItem);
  const rawMeats = [
    { name: 'Broiler Chicken', stock: '83.95 kg', min: '20 kg', health: 'healthy' },
    { name: 'Shinwari Mutton Cuts', stock: '42.00 kg', min: '10 kg', health: 'healthy' },
    { name: 'Fresh Surmai Fish', stock: '28.50 kg', min: '8 kg', health: 'healthy' },
    { name: 'Banaspati Ghee', stock: '119.88 L', min: '25 L', health: 'healthy' }
  ];

  // Anti-Theft Void Audit Log entries
  const voidLogs = [
    {
      id: 'v1',
      token: 'TKN-102',
      amount: 1360,
      manager: 'Shahmeer Khan (General Manager)',
      reason: 'Customer changed mind to Beef Karahi, approved by manager',
      time: '10:48 PM',
      severity: 'approved'
    },
    {
      id: 'v2',
      token: 'TKN-089',
      amount: 520,
      manager: 'Tariq Mehmood (Shift Supervisor)',
      reason: 'Biryani plate cold complain, replaced free of cost',
      time: '09:22 PM',
      severity: 'approved'
    }
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', overflow: 'hidden' }}>
      {/* Top Header Bar for Owner */}
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>👑</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: '#fff' }}>
              Owner Executive Mobile Portal
            </h2>
            <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981', fontSize: '10px', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
              LIVE FEED
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Real-time branch monitoring • Karachi Burns Road & Superhighway Branch
          </p>
        </div>

        {/* View mode toggle: Full screen or Simulated Mobile Phone */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setIsMobileFrame(false)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: !isMobileFrame ? 'var(--color-brand-primary)' : 'var(--bg-surface-elevated)',
              color: !isMobileFrame ? '#090d16' : '#fff',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Monitor size={14} />
            Desktop View
          </button>

          <button
            type="button"
            onClick={() => setIsMobileFrame(true)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: isMobileFrame ? 'var(--color-brand-primary)' : 'var(--bg-surface-elevated)',
              color: isMobileFrame ? '#090d16' : '#fff',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Smartphone size={14} />
            Smartphone Preview
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            width: isMobileFrame ? '390px' : '100%',
            maxWidth: isMobileFrame ? '390px' : '1100px',
            background: isMobileFrame ? '#020617' : 'transparent',
            borderRadius: isMobileFrame ? '36px' : '0',
            border: isMobileFrame ? '8px solid #334155' : 'none',
            boxShadow: isMobileFrame ? '0 25px 60px rgba(0,0,0,0.85)' : 'none',
            padding: isMobileFrame ? '20px 16px' : '0',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            transition: 'all 0.25s ease'
          }}
        >
          {isMobileFrame && (
            <div style={{ width: '120px', height: '18px', background: '#1e293b', borderRadius: '10px', margin: '0 auto 10px' }} />
          )}

          {/* 1. Live Revenue Snapshot KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobileFrame ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '12px' }}>
            <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                Today's Gross Sales
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, color: '#f59e0b', margin: '4px 0' }}>
                Rs. {totalRevenue.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TrendingUp size={12} /> +18.4% vs yesterday
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                Cash in Register
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, color: '#10b981', margin: '4px 0' }}>
                Rs. {cashRevenue.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Cashier: {activeShift?.cashierName?.split(' ')[0] || 'Asad'}
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                Card / Digital Pay
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, color: '#38bdf8', margin: '4px 0' }}>
                Rs. {cardRevenue.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Direct bank settlement
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                Rider COD Float
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, color: '#ec4899', margin: '4px 0' }}>
                Rs. {codRevenue.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                3 Motorbikes active
              </div>
            </div>
          </div>

          {/* 2. Daigh & Meat Inventory Real-Time Status */}
          <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Flame size={16} color="#ef4444" />
                Live Daigh & Raw Meat Inventory Monitor
              </h3>
              <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700 }}>
                Automation 1 & 2 Live
              </span>
            </div>

            {/* Daigh Countdown Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobileFrame ? '1fr' : 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
              {daighItems.map(d => {
                const isUnder5 = (d.daighPlatesRemaining ?? 4) < 5;
                return (
                  <div
                    key={d.id}
                    style={{
                      background: isUnder5 ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-surface-elevated)',
                      border: isUnder5 ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                      padding: '12px',
                      borderRadius: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: '#fff' }}>{d.name}</div>
                      {isUnder5 && (
                        <span style={{ background: '#ef4444', color: '#fff', fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                          LOW POT
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: 'var(--font-urdu)', fontSize: '11px', color: 'var(--text-muted)' }}>{d.urduName}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Remaining Plates:</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 900, color: isUnder5 ? '#ef4444' : '#10b981' }}>
                        {d.daighPlatesRemaining ?? 4} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>plates</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Raw Meat Cuts Status */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobileFrame ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '8px' }}>
              {rawMeats.map(m => (
                <div key={m.name} style={{ background: '#04070e', padding: '8px 10px', borderRadius: '8px', fontSize: '11px' }}>
                  <div style={{ color: 'var(--text-muted)' }}>{m.name}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 800, color: '#fff' }}>{m.stock}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Open Tables & Top Selling Dishes */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobileFrame ? '1fr' : '1fr 1fr', gap: '14px' }}>
            {/* Active Dine-In Tables */}
            <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Utensils size={16} color="#3b82f6" />
                Active Dine-In Tables
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeTables.map(t => (
                  <div key={t.tableNo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-elevated)', padding: '8px 12px', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: '#fff' }}>{t.tableNo}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.guests} Guests • Seated {t.duration} ago</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '13px', color: '#f59e0b' }}>
                        Rs. {t.amount.toLocaleString()}
                      </div>
                      <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>{t.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Selling Items Leaderboard */}
            <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={16} color="#10b981" />
                Top Selling Items Tonight
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {topDishes.map((dish, idx) => (
                  <div key={dish.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 900, color: 'var(--text-dim)', width: '16px' }}>#{idx + 1}</span>
                      <span style={{ fontWeight: 700, color: '#fff' }}>{dish.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 800, color: '#f59e0b' }}>{dish.count}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-dim)', marginLeft: '6px' }}>Rs. {dish.sales.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Anti-Theft Void Watchlist & Shift Reconciliations */}
          <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 800, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldAlert size={16} color="#ef4444" />
                Anti-Theft Void Watchlist (Automation 3 Audits)
              </h3>
              <span style={{ fontSize: '11px', color: '#fca5a5', fontWeight: 700 }}>
                Manager PIN Verified
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {voidLogs.map(log => (
                <div key={log.id} style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '10px 12px', borderRadius: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800, color: '#fff' }}>
                      Order #{log.token} Voided • Rs. {log.amount.toLocaleString()}
                    </span>
                    <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>{log.time}</span>
                  </div>
                  <div style={{ color: '#fca5a5', fontSize: '11px' }}>
                    Reason: <em>"{log.reason}"</em>
                  </div>
                  <div style={{ color: '#38bdf8', fontSize: '10px', marginTop: '2px', fontWeight: 600 }}>
                    Authorized by: {log.manager}
                  </div>
                </div>
              ))}
            </div>

            {/* Shift Discrepancy Note */}
            <div style={{ marginTop: '12px', borderTop: '1px dashed var(--border-medium)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Latest Cash Drawer Status:</span>
              <span style={{ fontWeight: 800, color: activeShift?.cashDiscrepancy < 0 ? '#ef4444' : '#10b981' }}>
                {activeShift?.cashDiscrepancy
                  ? `Shift #${activeShift.sessionNumber}: Rs. ${activeShift.cashDiscrepancy} (${activeShift.cashDiscrepancy < 0 ? 'SHORTAGE' : 'OVERAGE'})`
                  : `Shift #${activeShift?.sessionNumber || 104}: Active & Balanced`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
