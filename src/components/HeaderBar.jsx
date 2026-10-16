import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  Sparkles,
  Palette,
  Clock,
  Sun,
  Moon
} from 'lucide-react';
import { ROLES } from '../services/authService';
import { BRAND, BRAND_PRESETS } from '../config/brand';

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
  isRemoteConfigured,
  brand,
  onOpenSplash,
  onSelectBrand
}) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const currentBrand = brand || BRAND;

  // Real-Time Digital Counter Clock
  const [currentTime, setCurrentTime] = useState(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Modern Light / Moderate Theme is default. Night Shift toggle switches to dark theme.
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('pos_dark_theme') === 'true';
    }
    return false; // Default: Modern light/moderate!
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const savedDark = localStorage.getItem('pos_dark_theme') === 'true';
      if (savedDark) {
        document.documentElement.classList.add('pos-dark-theme');
      } else {
        document.documentElement.classList.remove('pos-dark-theme');
      }
    }
  }, []);

  function handleToggleTheme() {
    setIsDarkMode(prev => {
      const next = !prev;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('pos_dark_theme', String(next));
      }
      if (typeof document !== 'undefined') {
        if (next) {
          document.documentElement.classList.add('pos-dark-theme');
        } else {
          document.documentElement.classList.remove('pos-dark-theme');
        }
      }
      return next;
    });
  }

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
      alert(`Access Restricted: The ${view.label} screen requires Manager or Owner credentials. Please switch roles in the user menu to preview.`);
      return;
    }
    onSelectView(view.id);
  }

  return (
    <header className="pos-header">
      {/* 1. Left: Brand & Terminal Info */}
      <div 
        className="pos-logo-badge" 
        onClick={onOpenSplash}
        style={{ cursor: onOpenSplash ? 'pointer' : 'default' }}
        title={onOpenSplash ? 'Click to preview Brand & Staff Splash' : currentBrand.name}
      >
        <div 
          className="pos-logo-icon"
          style={{
            background: `linear-gradient(135deg, ${currentBrand.accentColor || '#f59e0b'}, ${currentBrand.accentHover || '#b45309'})`
          }}
        >
          {currentBrand.logoPath ? (
            <img src={currentBrand.logoPath} alt={currentBrand.name} style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          ) : (
            currentBrand.logoEmoji || '🍽️'
          )}
        </div>
        <div className="pos-title-block">
          <div className="pos-title-row">
            <h1 className="pos-title-text">{currentBrand.name.toUpperCase()}</h1>
            {currentBrand.nameUrdu && (
              <span className="font-urdu pos-urdu-badge" style={{ color: currentBrand.accentColor || 'var(--color-brand-primary)' }}>
                {currentBrand.nameUrdu}
              </span>
            )}
            <span className={`pos-mode-tag ${isRemoteConfigured ? 'remote' : 'demo'}`}>
              {isRemoteConfigured ? 'Supabase Live' : 'Demo Mode'}
            </span>
          </div>
          <p className="pos-subtitle-text">
            {currentBrand.tagline || currentBrand.branchInfo} • {activeShift?.terminalId || 'POS-01'} • Shift #{activeShift?.sessionNumber || 104}
          </p>
        </div>
      </div>

      {/* 2. Center: Screen Navigation Tabs */}
      <nav className="pos-view-nav" aria-label="POS Screen Views">
        {VIEWS.map(v => {
          const Icon = v.icon;
          const isActive = activeView === v.id;
          const isLocked = v.minRole && !v.minRole.includes(currentUser?.role);

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => handleViewClick(v)}
              className={`pos-view-btn ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
              title={isLocked ? 'Restricted: Requires Manager or Owner role' : v.label}
              style={isActive ? { background: currentBrand.accentColor || 'var(--color-brand-primary)' } : {}}
            >
              <Icon size={14} />
              <span>{v.label}</span>
              {isLocked && <span className="pos-lock-pill">LOCK</span>}
            </button>
          );
        })}
      </nav>

      {/* 3. Right: System Bar (Clock, Calm Network Status, Theme, Role, Actions) */}
      <div className="pos-status-group">
        {/* Live Digital Clock */}
        <div className="pos-header-clock" title="Counter Local Clock">
          <Clock size={13} />
          <span>{currentTime}</span>
        </div>

        {/* Theme Mode Toggle (Modern Light/Moderate vs Night Shift Dark) */}
        <button
          type="button"
          onClick={handleToggleTheme}
          className="pos-header-icon-btn"
          title={isDarkMode ? 'Switch to Modern Light/Moderate Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun size={15} color="#d97706" /> : <Moon size={15} />}
        </button>

        {/* User Role Menu */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowRoleMenu(prev => !prev)}
            className="pos-user-chip-btn"
            title="Active user & permissions"
          >
            <UserCheck size={13} color="#38bdf8" />
            <span className="pos-user-name">
              {currentUser?.name || 'Asad Ullah'} ({currentUser?.role?.toUpperCase() || 'CASHIER'})
            </span>
            <ChevronDown size={12} />
          </button>

          {showRoleMenu && (
            <div className="pos-user-dropdown-menu">
              <div className="pos-dropdown-header">Staff Role Simulation</div>
              {DEMO_ROLES.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    onChangeRole(r);
                    setShowRoleMenu(false);
                  }}
                  className={`pos-role-option-btn ${currentUser?.role === r.role ? 'selected' : ''}`}
                >
                  <span>{r.label}</span>
                  <span className="pos-role-sub">{r.name.split(' ')[0]}</span>
                </button>
              ))}

              {onSelectBrand && (
                <>
                  <div className="pos-dropdown-divider">
                    <Palette size={11} />
                    <span>Quick Client Presets</span>
                  </div>
                  {Object.values(BRAND_PRESETS).map(bp => (
                    <button
                      key={bp.id}
                      type="button"
                      onClick={() => {
                        onSelectBrand(bp);
                        setShowRoleMenu(false);
                      }}
                      className={`pos-role-option-btn ${currentBrand.id === bp.id ? 'active-brand' : ''}`}
                    >
                      <span>{bp.logoEmoji} {bp.name}</span>
                      {currentBrand.id === bp.id && <span style={{ fontSize: '10px', color: '#10b981' }}>Active</span>}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Brand Splash / Lock Screen Launcher */}
        {onOpenSplash && (
          <button
            type="button"
            onClick={onOpenSplash}
            className="pos-header-action-btn brand-btn"
            title="Open Brand Splash & Staff Sign-in"
          >
            <Sparkles size={13} />
            <span>Brand Info</span>
          </button>
        )}

        {/* Load-Shedding Simulation Cut */}
        <button
          type="button"
          onClick={onToggleSimulateOffline}
          title="Toggle Load-Shedding / Internet Cut Simulation"
          className={`pos-header-action-btn load-shed-btn ${isSimulatedOffline ? 'cut-active' : ''}`}
        >
          <Zap size={13} color={isSimulatedOffline ? '#ef4444' : '#f59e0b'} />
          <span>{isSimulatedOffline ? '⚡ Cut Active' : 'Cut Internet'}</span>
        </button>

        {/* Calm & Clear Online/Offline Indicator */}
        <div 
          className={`status-pill calm-status ${isOnline && !isSimulatedOffline ? 'online' : 'offline'}`}
          title={isOnline && !isSimulatedOffline ? 'Online: Transactions sync instantly to cloud' : 'Offline Safe Mode: Full local operation with background outbox queue'}
        >
          <span className="status-dot-pulse" />
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
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            <span>{pendingSyncCount} Outbox</span>
          </button>
        )}

        {/* F4: Manager Void Button */}
        <button
          type="button"
          onClick={onOpenVoidModal}
          className="pos-header-action-btn void-btn"
          title="Void order with 4-digit Manager PIN (Shortcut: F4)"
        >
          <ShieldAlert size={13} />
          <span>Void (F4)</span>
        </button>

        {/* F8: Blind Cash Shift Close Button */}
        <button
          type="button"
          onClick={onOpenShiftCloseModal}
          className="pos-header-action-btn shift-btn"
          title="Blind Cash Counting & Shift Locking (Shortcut: F8)"
        >
          <Lock size={13} color="var(--color-brand-primary)" />
          <span>Close Shift (F8)</span>
        </button>
      </div>
    </header>
  );
}
