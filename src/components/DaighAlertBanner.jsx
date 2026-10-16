import React from 'react';
import { AlertTriangle, Flame } from 'lucide-react';

export function DaighAlertBanner({ menuItems }) {
  // Find all Daigh items where plates remaining < 5
  const lowStockDaighs = menuItems.filter(
    item => item.isDaighItem && (item.isLowStock || (item.daighPlatesRemaining !== undefined && item.daighPlatesRemaining < (item.lowStockThreshold || 5)))
  );

  if (lowStockDaighs.length === 0) return null;

  return (
    <div className="daigh-banner">
      <div className="daigh-banner-content">
        <span className="daigh-badge">
          <Flame size={12} style={{ display: 'inline', marginRight: '4px' }} />
          Daigh Alert
        </span>
        <AlertTriangle size={14} />
        <div>
          {lowStockDaighs.map((item, idx) => (
            <span key={item.id} style={{ marginRight: '12px' }}>
              <strong>{item.name}:</strong> Only{' '}
              <span style={{ background: '#ef4444', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 900 }}>
                {item.daighPlatesRemaining ?? 4} plates
              </span>{' '}
              left!
            </span>
          ))}
        </div>
      </div>
      <div style={{ fontSize: '11px', opacity: 0.9, whiteSpace: 'nowrap' }}>
        ⚡ Under 5 Plates Rule
      </div>
    </div>
  );
}
