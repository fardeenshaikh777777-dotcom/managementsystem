import React, { useState } from 'react';
import { Search, Scale, AlertCircle, Plus, X } from 'lucide-react';

export function ItemGrid({ items, onSelectItem }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      (item.urduName && item.urduName.includes(q)) ||
      (item.station && item.station.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Search Bar */}
      <div className="search-filter-bar">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search dish name, Urdu, or station (e.g., Broast, کڑاہی, Shinwari, Biryani)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                color: 'var(--text-dim)',
                display: 'flex'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 600 }}>
          {filteredItems.length} {filteredItems.length === 1 ? 'Dish' : 'Dishes'}
        </div>
      </div>

      {/* Grid of Touch Cards */}
      <div className="item-grid-scroll">
        <div className="item-grid">
          {filteredItems.map(item => {
            const isVariableWeight = item.pricingType === 'per_kg';
            const isLowStock = item.isLowStock || (item.isDaighItem && item.daighPlatesRemaining < 5);

            return (
              <div
                key={item.id}
                className={`pos-item-card ${isVariableWeight ? 'is-variable-weight' : ''} ${isLowStock ? 'is-low-stock' : ''}`}
                onClick={() => onSelectItem(item)}
                role="button"
                tabIndex={0}
              >
                <div>
                  <div className="card-top-row">
                    <span className="item-name-en">{item.name}</span>
                    {isVariableWeight && (
                      <span className="item-badge-pill weight" title="Variable Weight item - Price calculated by weighed KG">
                        <Scale size={10} style={{ display: 'inline', marginRight: '3px' }} />
                        Per KG
                      </span>
                    )}
                    {isLowStock && (
                      <span className="item-badge-pill daigh-low" title="Fewer than 5 plates remaining in Daigh!">
                        <AlertCircle size={10} style={{ display: 'inline', marginRight: '3px' }} />
                        {item.daighPlatesRemaining !== undefined ? `${item.daighPlatesRemaining} Left` : 'Low Stock'}
                      </span>
                    )}
                  </div>
                  {item.urduName && (
                    <div className="item-name-urdu">{item.urduName}</div>
                  )}
                </div>

                <div className="card-bottom-row">
                  <div>
                    <span className="item-price-tag">
                      Rs. {item.basePrice.toLocaleString()}
                    </span>
                    <span className="item-price-unit">
                      {isVariableWeight ? ' / kg' : ` / ${item.unit || 'dish'}`}
                    </span>
                  </div>
                  <div className="add-plus-badge">
                    <Plus size={16} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
