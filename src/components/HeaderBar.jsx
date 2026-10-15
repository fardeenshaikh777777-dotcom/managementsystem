import React, { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  ShieldAlert, 
  Lock, 
  Zap, 
  LayoutGrid, 
  Bike, 
  DollarSign, 
  Smartphone, 
  UserCheck, 
  Database,
  ChevronDown
} from 'lucide-react';
import { ROLES } from '../services/authService';

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
  onOpenShiftCloseModal,
  currentUser,
  onChangeRole,
  isRemoteConfigured
}) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const VIEWS = [
    { id: 'pos', label: 'Counter POS', icon: LayoutGrid, minRole: null },
    { id: 'riders', label: 'Rider Ledger', icon: Bike, minRole: null },
    { id: 'blind_cash', label: 'Blind Cash Closing', icon: DollarSign, minRole: null },
    { id: 'owner', label: 'Owner Mobile View', icon: Smartphone, minRole: [ROLES.OWNER, ROLES.MANAGER] }
  ];

  const DEMO_ROLES = [
    { id: 'usr-cashier-01', name: 'Asad Ullah', role: ROLES.CASHIER, label: 'Cashier (Counter)' },
    { id: 'usr-sup-01', name: 'Tariq Mehmood', role: ROLES.SUPERVISOR, label: 'Shift Supervisor' },
    { id: 'usr-mgr-01', name: 'Shahmeer Khan', role: ROLES.MANAGER, label: 'General Manager' },
    { id: 'usr-owner-01', name: 'Farhan Saeed', role: ROLES.OWNER, label: 'Restaurant Owner' }
  ];

  function handleViewClick(view) {
    if (view.minRole && !view.minRole.includes(currentUser?.role)) {
      alert(`Access Restricted: The ${view.label} screen requires Manager or Owner credentials. Please switch roles in the header to preview.`);
      return;
    }
    onSelectView(view.id);
  }

  return (
    <header className="pos-header">
      {/* Brand & Terminal Info */}
      <div className="pos-logo-badge">
        <div className="pos-logo-icon">🔥</div>
        <div className="pos-title-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0 }}>KARACHI EXPRESS POS</h1>
            {/* Clear Mode Badge: Distinguishes Demo Mode vs Remote Connected */}
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                background: isRemoteConfigured ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: isRemoteConfigured ? '#34d399' : '#fbbf24',
                border: isRemoteConfigured ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)'
              }}
            >
              {isRemoteConfigured ? 'Supabase Live' : 'Demo Mode (IndexedDB)'}
            </span>
          </div>
          <p>
            Burns Road & Highway • {activeShift?.terminalId || 'POS-01'} • Shift #{activeShift?.sessionNumber || 104}
          </p>
        </div>
      </div>

      {/* Center Navigation Switcher Tabs */}
      <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-app)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
        {VIEWS.map(v => {
          const Icon = v.icon;
          const isActive = activeView === v.id;
          const isLocked = v.minRole && !v.minRole.includes(currentUser?.role);

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => handleViewClick(v)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: isActive ? 'var(--color-brand-primary)' : 'transparent',
                color: isActive ? '#090d16' : isLocked ? 'var(--text-dim)' : 'var(--text-muted)',
                fontFamily: 'var(--font-display)',
                fontSize: '12px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
                opacity: isLocked ? 0.6 : 1
              }}
              title={isLocked ? 'Restricted: Requires Manager or Owner role' : v.label}
            >
              <Icon size={14} />
              <span>{v.label}</span>
              {isLocked && <span style={{ fontSize: '9px', background: '#334155', color: '#94a3b8', padding: '1px 4px', borderRadius: '4px' }}>LOCK</span>}
            </button>
          );
        })}
      </div>

      {/* Right Controls: Role Switcher, Network, Load-Shedding & Shortcuts */}
      <div className="pos-status-group">
        {/* Role Switcher Dropdown (Priority 0 RBAC) */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowRoleMenu(prev => !prev)}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              background: 'var(--bg-surface-elevated)',
              color: '#38bdf8',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
            title="Active user & role permissions"
          >
            <UserCheck size={13} color="#38bdf8" />
            <span>{currentUser?.name || 'Asad Ullah'} ({currentUser?.role?.toUpperCase() || 'CASHIER'})</span>
            <ChevronDown size={12} />
          </button>

          {showRoleMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                background: '#090d16',
                border: '1px solid var(--border-medium)',
                borderRadius: '10px',
                padding: '6px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 100,
                minWidth: '200px'
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--text-dim)', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Switch Role Simulation
              </div>
              {DEMO_ROLES.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    onChangeRole(r);
                    setShowRoleMenu(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: currentUser?.role === r.role ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    color: currentUser?.role === r.role ? '#38bdf8' : '#e2e8f0',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>{r.label}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{r.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Load-Shedding / Offline Simulator Toggle */}
        <button
          type="button"
          onClick={onToggleSimulateOffline}
          title="Toggle Load-Shedding / Internet Cut Simulation"
          style={{
            padding: '6px 10px',
            borderRadius: '8px',
            background: isSimulatedOffline ? '#7f1d1d' : 'var(--bg-surface-elevated)',
            color: isSimulatedOffline ? '#fca5a5' : 'var(--text-muted)',
            border: isSimulatedOffline ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <Zap size={13} color={isSimulatedOffline ? '#ef4444' : '#f59e0b'} />
          {isSimulatedOffline ? '⚡ Cut Active' : 'Cut Internet'}
        </button>

        {/* Live Online/Offline Status Indicator */}
        <div className={`status-pill ${isOnline && !isSimulatedOffline ? 'online' : 'offline'}`}>
          {isOnline && !isSimulatedOffline ? (
            <>
              <Wifi size={13} />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff size={13} />
              <span>Offline (Safe)</span>
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
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            <span>{pendingSyncCount} Outbox</span>
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
            padding: '6px 10px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer'
          }}
          title="Void order with 4-digit Manager PIN (Shortcut: F4)"
        >
          <ShieldAlert size={13} />
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
            padding: '6px 10px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer'
          }}
          title="Blind Cash Counting & Shift Locking (Shortcut: F8)"
        >
          <Lock size={13} color="#f59e0b" />
          <span>Close Shift (F8)</span>
        </button>
      </div>
    </header>
  );
}
