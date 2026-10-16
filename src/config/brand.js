// ==============================================================================
// WHITE-LABEL BRAND CONFIGURATION (src/config/brand.js)
// Re-brand the entire POS demo for any restaurant client in under a minute!
// Set ACTIVE_PRESET to 'default', 'karachiExpress', 'shinwari', or 'biryaniHouse'.
// ==============================================================================

export const BRAND_PRESETS = {
  // 1. Default White-Label Placeholder (Requested Default)
  default: {
    id: 'default',
    name: 'Your Restaurant',
    nameUrdu: 'آپ کا ریسٹورنٹ',
    tagline: 'Fresh Flavors & Traditional Hospitality',
    taglineUrdu: 'تازہ اور لذیذ روایتی ذائقہ',
    logoPath: '', // Set image path (e.g., '/logo.png') or leave empty for logoEmoji
    logoEmoji: '🍽️',
    accentColor: '#f59e0b', // Saffron Amber
    accentHover: '#d97706',
    currency: 'Rs.',
    branchInfo: 'Main Branch • POS-01',
    address: 'Main Commercial Avenue, Karachi',
    phone: '0300-1234567 / 021-34567890',
    ntn: '1234567-8',
    srbReg: '15-00-1234-001'
  },

  // 2. Karachi Express POS Preset
  karachiExpress: {
    id: 'karachiExpress',
    name: 'Karachi Express POS',
    nameUrdu: 'کراچی ایکسپریس',
    tagline: 'Burns Road & Highway • Traditional Karachi Taste',
    taglineUrdu: 'برنس روڈ اور ہائی وے کا روایتی ذائقہ',
    logoPath: '',
    logoEmoji: '🔥',
    accentColor: '#f59e0b',
    accentHover: '#d97706',
    currency: 'Rs.',
    branchInfo: 'Burns Road & Highway • POS-01',
    address: 'Highway & Burns Road • Karachi',
    phone: '021-34981024 / 0300-9284719',
    ntn: '8920194-2',
    srbReg: '15-00-9821-001'
  },

  // 3. Khyber Shinwari & Karahi Preset
  shinwari: {
    id: 'shinwari',
    name: 'Khyber Shinwari & BBQ',
    nameUrdu: 'خیبر شنواری اور باربی کیو',
    tagline: 'Highway Slow Coal Karahi & Shinwari Dumba',
    taglineUrdu: 'اصلی شنواری دنبہ کڑاہی اور کوئلہ باربی کیو',
    logoPath: '',
    logoEmoji: '🍖',
    accentColor: '#ef4444', // Ruby Flame
    accentHover: '#dc2626',
    currency: 'Rs.',
    branchInfo: 'Superhighway Branch • POS-02',
    address: 'Main Superhighway, Toll Plaza, Karachi',
    phone: '0301-8889990',
    ntn: '9845120-4',
    srbReg: '15-00-8841-002'
  },

  // 4. Al-Madina Biryani & Daigh Preset
  biryaniHouse: {
    id: 'biryaniHouse',
    name: 'Al-Madina Daigh Biryani',
    nameUrdu: 'المدینہ دیغی بریانی',
    tagline: 'Fresh Dum Biryani & Pulao • Daily Daighs',
    taglineUrdu: 'گرم گرم دم بریانی اور روایتی پلاؤ',
    logoPath: '',
    logoEmoji: '🍚',
    accentColor: '#10b981', // Emerald Jade
    accentHover: '#059669',
    currency: 'Rs.',
    branchInfo: 'Saddar Branch • POS-01',
    address: 'Saddar Food Street, Karachi',
    phone: '0321-4455667',
    ntn: '7731204-1',
    srbReg: '15-00-7731-003'
  }
};

/**
 * ACTIVE_PRESET selector
 * Default is 'default' ("Your Restaurant").
 * Change to 'karachiExpress' or any preset key to switch immediately.
 */
export const ACTIVE_PRESET = 'default';

// Current active brand config
export const BRAND = BRAND_PRESETS[ACTIVE_PRESET] || BRAND_PRESETS.default;

/**
 * Injects brand styling variables dynamically into the DOM root
 */
export function applyBrandTheme(brand = BRAND) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (brand.accentColor) {
    root.style.setProperty('--color-brand-primary', brand.accentColor);
    root.style.setProperty('--color-brand-primary-hover', brand.accentHover || brand.accentColor);
    root.style.setProperty('--border-accent', `${brand.accentColor}66`);
    root.style.setProperty('--shadow-glow-amber', `0 0 20px ${brand.accentColor}40`);
  }
  document.title = `${brand.name} — Touch Terminal`;
}

export default BRAND;
