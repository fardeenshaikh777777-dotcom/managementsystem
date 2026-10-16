import React, { useRef } from 'react';
import { CATEGORIES } from '../data/mockData';

export function CategoryNav({
  categories = CATEGORIES,
  activeCategory = 'all',
  onSelectCategory,
  itemCounts = {}
}) {
  const scrollRef = useRef(null);
  
  // Ensure we have a valid list of categories
  const categoryList = Array.isArray(categories) && categories.length > 0 && categories[0].name
    ? categories
    : CATEGORIES;

  const handleSelect = (catId) => {
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
  };

  return (
    <nav className="pos-category-nav-wrapper" aria-label="Menu Categories">
      <div className="category-tabs-bar" ref={scrollRef} role="tablist">
        {categoryList.map(cat => {
          const isActive = activeCategory === cat.id;
          const count = itemCounts[cat.id];

          return (
            <button
              key={cat.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={0}
              onClick={() => handleSelect(cat.id)}
              className={`cat-tab-btn ${isActive ? 'active' : ''}`}
              type="button"
            >
              <span className="cat-tab-icon" aria-hidden="true">{cat.icon}</span>
              <div className="cat-tab-labels">
                <span className="cat-tab-en">{cat.name}</span>
                {cat.urdu && <span className="cat-tab-urdu" dir="rtl">{cat.urdu}</span>}
              </div>
              {count !== undefined && count > 0 && (
                <span className="cat-tab-count-badge">{count}</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default CategoryNav;
