import React from 'react';
import { CATEGORIES } from '../data/mockData';

export function CategoryNav({ activeCategory, onSelectCategory }) {
  return (
    <nav className="category-tabs-bar" aria-label="Menu Categories">
      {CATEGORIES.map(cat => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`cat-tab-btn ${isActive ? 'active' : ''}`}
            type="button"
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
            <span className="cat-tab-urdu">{cat.urdu}</span>
          </button>
        );
      })}
    </nav>
  );
}
