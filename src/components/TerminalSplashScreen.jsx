import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  UserCheck, 
  Store, 
  Palette, 
  Lock
} from 'lucide-react';
import { BRAND, BRAND_PRESETS } from '../config/brand';
import { ROLES } from '../services/authService';

export function TerminalSplashScreen({
  currentBrand,
  onSelectBrand,
  currentUser,
  onChangeRole,
  activeShift,
  onEnterPOS
}) {
  const brand = currentBrand || BRAND;

  const DEMO_STAFF = [
    { id: 'usr-cashier-01', name: 'Asad Ullah', role: ROLES.CASHIER, label: 'Cashier (Counter)' },
    { id: 'usr-sup-01', name: 'Tariq Mehmood', role: ROLES.SUPERVISOR, label: 'Shift Supervisor' },
    { id: 'usr-mgr-01', name: 'Shahmeer Khan', role: ROLES.MANAGER, label: 'General Manager' },
    { id: 'usr-owner-01', name: 'Farhan Saeed', role: ROLES.OWNER, label: 'Restaurant Owner' }
  ];

  return (
    <div className="pos-splash-overlay">
      <div className="pos-splash-card">
        {/* Top Decorative Glow & Badge */}
        <div className="pos-splash-header-badge">
          <span className="pos-splash-tag">
            <Sparkles size={12} />
            White-Label Restaurant POS Terminal
          </span>
          <span className="pos-splash-shift-tag">
            {brand.branchInfo} • Shift #{activeShift?.sessionNumber || 104}
          </span>
        </div>

        {/* Central Brand Identity */}
        <div className="pos-splash-brand-hero">
          <div className="pos-splash-logo-wrap" style={{ borderColor: brand.accentColor }}>
            {brand.logoPath ? (
              <img src={brand.logoPath} alt={brand.name} className="pos-splash-logo-img" />
            ) : (
              <span className="pos-splash-logo-emoji">{brand.logoEmoji || '🍽️'}</span>
            )}
          </div>

          <h1 className="pos-splash-title">{brand.name}</h1>
          {brand.nameUrdu && (
            <div className="pos-splash-urdu-title font-urdu">
              {brand.nameUrdu}
            </div>
          )}

          <p className="pos-splash-tagline">{brand.tagline}</p>
          {brand.taglineUrdu && (
            <p className="pos-splash-tagline-urdu font-urdu">{brand.taglineUrdu}</p>
          )}
        </div>

        {/* Fast Client Demo: 1-Click Brand Preset Switcher */}
        {onSelectBrand && (
          <div className="pos-splash-preset-box">
            <div className="pos-splash-box-label">
              <Palette size={13} />
              <span>Instant Re-Brand Demo Presets:</span>
            </div>
            <div className="pos-splash-preset-buttons">
              {Object.values(BRAND_PRESETS).map(p => {
                const isActive = brand.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelectBrand(p)}
                    className={`pos-splash-preset-btn ${isActive ? 'active' : ''}`}
                    style={isActive ? { borderColor: p.accentColor, boxShadow: `0 0 10px ${p.accentColor}40` } : {}}
                  >
                    <span className="pos-preset-emoji">{p.logoEmoji}</span>
                    <span className="pos-preset-name">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Staff Profile Selection */}
        <div className="pos-splash-staff-box">
          <div className="pos-splash-box-label">
            <UserCheck size={13} />
            <span>Active Staff Login Session:</span>
          </div>
          <div className="pos-splash-staff-grid">
            {DEMO_STAFF.map(staff => {
              const isSelected = currentUser?.role === staff.role;
              return (
                <button
                  key={staff.id}
                  type="button"
                  onClick={() => onChangeRole && onChangeRole(staff)}
                  className={`pos-splash-staff-btn ${isSelected ? 'selected' : ''}`}
                >
                  <div className="pos-staff-info">
                    <span className="pos-staff-name">{staff.name}</span>
                    <span className="pos-staff-role">{staff.label}</span>
                  </div>
                  {isSelected && <ShieldCheck size={16} color="var(--color-brand-primary)" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA Launch Counter Terminal */}
        <button
          type="button"
          onClick={onEnterPOS}
          className="pos-splash-cta-btn"
          style={{
            background: `linear-gradient(135deg, ${brand.accentColor}, ${brand.accentHover || brand.accentColor})`
          }}
        >
          <span>Open Touch Counter Terminal</span>
          <ArrowRight size={18} />
        </button>

        <div className="pos-splash-footer">
          <span>NTN: {brand.ntn}</span> • <span>SRB Reg: {brand.srbReg}</span> • <span>Phone: {brand.phone}</span>
        </div>
      </div>
    </div>
  );
}
