import React, { useState } from 'react';
import { Search, Scale, AlertTriangle, Plus, X, Flame, Sparkles, UtensilsCrossed } from 'lucide-react';
import { BRAND } from '../config/brand';

/**
 * Returns a tasteful culinary fallback theme (gradient + watermark icon)
 * for dishes without an image asset.
 */
function getDishCardTheme(item) {
  const cat = (item.categoryId || '').toLowerCase();
  const station = (item.station || '').toLowerCase();

  if (cat === 'broast' || station.includes('fryer')) {
    return {
      gradient: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #d97706 100%)',
      accent: '#f59e0b',
      icon: '🍗',
      label: 'Fryer'
    };
  }
  if (cat === 'biryani' || item.isDaighItem || station.includes('daigh')) {
    return {
      gradient: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 50%, #d97706 100%)',
      accent: '#f97316',
      icon: '🍚',
      label: 'Daigh'
    };
  }
  if (cat === 'karahi' || station.includes('wok') || item.pricingType === 'per_kg') {
    return {
      gradient: 'linear-gradient(135deg, #431407 0%, #9a3412 50%, #ea580c 100%)',
      accent: '#fb923c',
      icon: '🥘',
      label: 'Wok/Karahi'
    };
  }
  if (cat === 'bbq' || station.includes('bbq') || station.includes('grill')) {
    return {
      gradient: 'linear-gradient(135deg, #1c1917 0%, #44403c 50%, #dc2626 100%)',
      accent: '#ef4444',
      icon: '🍢',
      label: 'Charcoal'
    };
  }
  if (cat === 'tandoor' || station.includes('tandoor')) {
    return {
      gradient: 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #92400e 100%)',
      accent: '#fde047',
      icon: '🫓',
      label: 'Tandoor'
    };
  }
  if (cat === 'drinks' || station.includes('tea') || station.includes('bar')) {
    return {
      gradient: 'linear-gradient(135deg, #042f2e 0%, #0f766e 50%, #14b8a6 100%)',
      accent: '#2dd4bf',
      icon: '☕',
      label: 'Beverage'
    };
  }

  // Default culinary dark gradient
  return {
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    accent: '#94a3b8',
    icon: '🍽️',
    label: 'Kitchen'
  };
}

export function ItemGrid({
  items = [],
  onSelectItem,
  currency = BRAND.currency,
  onOpenWeightModal
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [imgErrors, setImgErrors] = useState({});

  const filteredItems = items.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.name.toLowerCase().includes(q) ||
      (item.urduName && item.urduName.includes(q)) ||
      (item.station && item.station.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q))
    );
  });

  const handleImageError = (id) => {
    setImgErrors(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div className="pos-item-grid-container">
      {/* Search and Filter Top Bar */}
      <div className="search-filter-bar">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" aria-hidden="true" />
          <input
            type="text"
            className="search-input"
            placeholder="Search dish (e.g. Broast, کڑاہی, Shinwari, Biryani, Roti)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="Search dishes"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="dish-count-indicator">
          <span className="count-number">{filteredItems.length}</span>
          <span className="count-label">{filteredItems.length === 1 ? 'Dish' : 'Dishes'}</span>
        </div>
      </div>

      {/* Main Touch Grid Area */}
      <div className="item-grid-scroll">
        {filteredItems.length === 0 ? (
          <div className="item-grid-empty-state">
            <div className="empty-state-icon-circle">
              <UtensilsCrossed size={36} />
            </div>
            <h3 className="empty-state-title">No Dishes Found</h3>
            <p className="empty-state-desc">
              {searchQuery
                ? `No menu items match "${searchQuery}". Check your spelling or try another dish.`
                : 'No dishes are available in this category right now.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                className="empty-state-action-btn"
                onClick={() => setSearchQuery('')}
              >
                Clear Search Query
              </button>
            )}
          </div>
        ) : (
          <div className="item-grid">
            {filteredItems.map(item => {
              const theme = getDishCardTheme(item);
              const isVariableWeight = item.pricingType === 'per_kg';
              const isDaighItem = item.isDaighItem;
              const daighRemaining = item.daighPlatesRemaining;
              const isLowStock =
                item.isLowStock ||
                (isDaighItem && daighRemaining !== undefined && daighRemaining < 5);
              const isOutOfStock = item.isAvailable === false || (daighRemaining !== undefined && daighRemaining <= 0);

              const hasImage = (item.image || item.imageUrl) && !imgErrors[item.id];

              return (
                <div
                  key={item.id}
                  className={`pos-dish-card ${isOutOfStock ? 'is-out-of-stock' : ''} ${isLowStock ? 'is-low-stock' : ''} ${isVariableWeight ? 'is-variable-weight' : ''}`}
                  onClick={() => {
                    if (isOutOfStock) return;
                    if (onSelectItem) onSelectItem(item);
                  }}
                  onKeyDown={(e) => {
                    if (isOutOfStock) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (onSelectItem) onSelectItem(item);
                    }
                  }}
                  role="button"
                  tabIndex={isOutOfStock ? -1 : 0}
                  aria-disabled={isOutOfStock}
                  aria-label={`${item.name}, ${currency} ${item.basePrice}${isVariableWeight ? ' per kilogram' : ''}`}
                >
                  {/* Visual Banner Header (Photo or Tasteful Fallback Gradient + Icon) */}
                  <div
                    className="dish-card-banner"
                    style={{ background: hasImage ? undefined : theme.gradient }}
                  >
                    {hasImage ? (
                      <img
                        src={item.image || item.imageUrl}
                        alt={item.name}
                        className="dish-card-image"
                        onError={() => handleImageError(item.id)}
                        loading="lazy"
                      />
                    ) : (
                      <div className="dish-fallback-art">
                        <span className="dish-fallback-icon" aria-hidden="true">{theme.icon}</span>
                        <div className="dish-fallback-glow" />
                      </div>
                    )}

                    {/* Top Badges Overlay */}
                    <div className="dish-card-badges-row">
                      {isVariableWeight && (
                        <span className="dish-badge-pill weight" title="Variable Weight item - Weighed on Scale">
                          <Scale size={11} className="badge-svg-icon" />
                          <span>Per KG</span>
                        </span>
                      )}

                      {isOutOfStock ? (
                        <span className="dish-badge-pill out-of-stock">
                          Sold Out
                        </span>
                      ) : isLowStock ? (
                        <span className="dish-badge-pill low-stock" title="Low Stock Warning">
                          <AlertTriangle size={11} className="badge-svg-icon" />
                          <span>{daighRemaining !== undefined ? `${daighRemaining} Left` : 'Low Stock'}</span>
                        </span>
                      ) : isDaighItem && daighRemaining !== undefined ? (
                        <span className="dish-badge-pill daigh-count">
                          <Flame size={11} className="badge-svg-icon" />
                          <span>{daighRemaining} plates</span>
                        </span>
                      ) : null}
                    </div>

                    {/* Station Tag in Bottom-Right Corner of Banner */}
                    <span className="dish-card-station-tag">
                      {item.station || theme.label}
                    </span>
                  </div>

                  {/* Dish Info Body */}
                  <div className="dish-card-body">
                    <div className="dish-card-titles">
                      <h4 className="dish-name-en">{item.name}</h4>
                      {item.urduName && (
                        <div className="dish-name-urdu" dir="rtl">{item.urduName}</div>
                      )}
                    </div>

                    {/* Pricing & Add Stepper Row */}
                    <div className="dish-card-footer">
                      <div className="dish-price-block">
                        <span className="dish-price-currency">{currency}</span>
                        <span className="dish-price-amount">
                          {Number(item.basePrice).toLocaleString()}
                        </span>
                        <span className="dish-price-unit">
                          {isVariableWeight ? '/kg' : item.unit ? `/${item.unit}` : ''}
                        </span>
                      </div>

                      <div
                        className={`dish-add-action ${isOutOfStock ? 'disabled' : ''}`}
                        title={isOutOfStock ? 'Item is sold out' : isVariableWeight ? 'Weigh Item' : 'Add to Bill'}
                      >
                        {isVariableWeight ? (
                          <Scale size={15} />
                        ) : (
                          <Plus size={16} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ItemGrid;
