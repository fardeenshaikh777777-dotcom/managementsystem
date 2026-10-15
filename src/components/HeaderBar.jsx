import React from 'react';
import { Wifi, WifiOff, RefreshCw, ShieldAlert, Lock, Zap, LayoutGrid, Bike, DollarSign, Smartphone } from 'lucide-react';

export function HeaderBar({
  isOnline,
  isSimulatedOffline,
  onToggleSimulateOffline,
  pendingSyncCount,
  onSyncNow,
  isSyncing,
  activeShift,
  activeView,
  onSelectView,
  onOpenVoidModal,
  onOpenShiftCloseModal
}) {
  const VIEWS = [
    { id: 'pos', label: 'Counter POS', icon: LayoutGrid },
    { id: 'riders', label: 'Rider Ledger', icon: Bike },
    { id: 'blind_cash', label: 'Blind Cash Closing', icon: DollarSign },
    { id: 'owner', label: 'Owner Mobile View', icon: Smartphone }
  ];

  return (
    <header className="pos-header">
      {/* Brand & Terminal Info */}
      <div className="pos-logo-badge">
        <div className="pos-logo-icon">🔥</div>
        <div className="pos-title-block">
          <h1>
            KARACHI EXPRESS POS
            <span style={{ fontSize: '11px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
              TOUCH COUNTER
            </span>
          </h1>
          <p>
            Burns Road & Highway Outlets • {activeShift?.terminalId || 'POS-01'} • Cashier: {activeShift?.cashierName || 'Asad Ullah'} (Shift #{activeShift?.sessionNumber || 104})
          </p>
        </div>
      </div>

      {/* Center Navigation Switcher Tabs */}
      <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-app)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
        {VIEWS.map(v => {
          const Icon = v.icon;
          const isActive = activeView === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelectView(v.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: isActive ? 'var(--color-brand-primary)' : 'transparent',
                color: isActive ? '#090d16' : 'var(--text-muted)',
                fontFamily: 'var(--font-display)',
                fontSize: '12px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                transition: 'all 0.12s ease'
              }}
            >
              <Icon size={14} />
              <span>{v.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Controls: Network / Load-Shedding & Shortcuts */}
      <div className="pos-status-group">
        {/* Load-Shedding / Offline Simulator Toggle */}
        <button
          type="button"
          onClick={onToggleSimulateOffline}
          title="Toggle Load-Shedding / Internet Cut Simulation"
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            background: isSimulatedOffline ? '#7f1d1d' : 'var(--bg-surface-elevated)',
            color: isSimulatedOffline ? '#fca5a5' : 'var(--text-muted)',
            border: isSimulatedOffline ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 700
          }}
        >
          <Zap size={14} color={isSimulatedOffline ? '#ef4444' : '#f59e0b'} />
          {isSimulatedOffline ? '⚡ Load-Shedding ON' : 'Simulate Offline'}
        </button>

        {/* Live Online/Offline Status Indicator */}
        <div className={`status-pill ${isOnline && !isSimulatedOffline ? 'online' : 'offline'}`}>
          {isOnline && !isSimulatedOffline ? (
            <>
              <Wifi size={14} />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff size={14} />
              <span>⚡ Load-Shedding Mode</span>
            </>
          )}
        </div>

        {/* Pending Offline Sync Badge */}
        {pendingSyncCount > 0 && (
          <button
            type="button"
            onClick={onSyncNow}
            disabled={isSyncing}
            className="status-pill syncing"
            title="Click to push offline orders to cloud"
            style={{ cursor: 'pointer' }}
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            <span>{pendingSyncCount} Pending Sync</span>
          </button>
        )}

        {/* F4: Manager Void Button (Automation 3) */}
        <button
          type="button"
          onClick={onOpenVoidModal}
          style={{
            background: 'var(--color-ruby-light)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            padding: '7px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          title="Void order with 4-digit Manager PIN (Shortcut: F4)"
        >
          <ShieldAlert size={14} />
          <span>Void (F4)</span>
        </button>

        {/* F8: Blind Cash Shift Close Button (Automation 4) */}
        <button
          type="button"
          onClick={onOpenShiftCloseModal}
          style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            color: '#e2e8f0',
            border: '1px solid var(--border-medium)',
            padding: '7px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          title="Blind Cash Counting & Shift Locking (Shortcut: F8)"
        >
          <Lock size={14} color="#f59e0b" />
          <span>Close Shift (F8)</span>
        </button>
      </div>
    </header>
  );
}
