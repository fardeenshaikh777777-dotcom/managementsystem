// ==============================================================================
// KARACHI EXPRESS POS — ENTERPRISE OPERATIONAL SEED DATA (data/mockData.js)
// Aligned with Supabase PostgreSQL schema, kitchen stations, and inventory BOM
// ==============================================================================

export const CATEGORIES = [
  { id: 'all', name: 'All Items', urdu: 'تمام اشیاء', icon: '🔥' },
  { id: 'broast', name: 'Broast & Fast Food', urdu: 'بروسٹ اور فاسٹ فوڈ', icon: '🍗' },
  { id: 'biryani', name: 'Biryani & Daighs', urdu: 'بریانی اور دیگیں', icon: '🍚' },
  { id: 'karahi', name: 'Karahi & Shinwari', urdu: 'کڑاہی اور شنواری', icon: '🥘' },
  { id: 'bbq', name: 'BBQ & Kabab', urdu: 'بار بی کیو اور کباب', icon: '🍢' },
  { id: 'tandoor', name: 'Tandoor & Breads', urdu: 'تندور اور نان', icon: '🫓' },
  { id: 'drinks', name: 'Chai & Drinks', urdu: 'چائے اور مشروبات', icon: '☕' }
];

export const INITIAL_MENU_ITEMS = [
  // 1. Fast Food & Broast (Station: Deep Fryer 11111111-1111-1111-1111-111111111003)
  {
    id: '44444444-4444-4444-4444-444444444004',
    legacyId: 'item-broast-qtr',
    categoryId: 'broast',
    name: 'Quarter Chicken Broast (Crispy)',
    urduName: 'کوآرٹر چکن بروسٹ',
    pricingType: 'fixed',
    basePrice: 680,
    unit: 'portion',
    description: 'Iconic Karachi golden crisp chicken with homemade garlic dip, spiced fries, and bun.',
    isAvailable: true,
    isDaighItem: false,
    isLowStock: false,
    kitchenStationId: '11111111-1111-1111-1111-111111111003',
    station: 'Fryer Station'
  },
  {
    id: '44444444-4444-4444-4444-444444444011',
    legacyId: 'item-zinger-burger',
    categoryId: 'broast',
    name: 'Karachi Zinger Supreme',
    urduName: 'زنگر برگر اسپیشل',
    pricingType: 'fixed',
    basePrice: 550,
    unit: 'piece',
    description: 'Jumbo spicy fried chicken thigh, ice-berg lettuce, chipotle mayo.',
    isAvailable: true,
    isDaighItem: false,
    isLowStock: false,
    kitchenStationId: '11111111-1111-1111-1111-111111111003',
    station: 'Fryer Station'
  },

  // 2. Variable-Weight Items (Station: Wok/Karahi 11111111-1111-1111-1111-111111111001)
  {
    id: '44444444-4444-4444-4444-444444444001',
    legacyId: 'item-shinwari-chk',
    categoryId: 'karahi',
    name: 'Chicken Shinwari Karahi (Fresh)',
    urduName: 'شنواری چکن کڑاہی',
    pricingType: 'per_kg',
    basePrice: 1850,
    unit: 'kg',
    minWeightKg: 0.5,
    maxWeightKg: 5.0,
    description: 'Authentic Highway style cooked strictly in animal fat, fresh tomatoes, green chilies, and salt.',
    isAvailable: true,
    isDaighItem: false,
    isLowStock: false,
    kitchenStationId: '11111111-1111-1111-1111-111111111001',
    station: 'Wok / Karahi'
  },
  {
    id: '44444444-4444-4444-4444-444444444002',
    legacyId: 'item-shinwari-mut',
    categoryId: 'karahi',
    name: 'Mutton Shinwari Koyla Karahi',
    urduName: 'کوئلہ مٹن کڑاہی',
    pricingType: 'per_kg',
    basePrice: 3600,
    unit: 'kg',
    minWeightKg: 0.5,
    maxWeightKg: 6.0,
    description: 'Fresh baby goat cuts slow-cooked on coal burners with rich bone gravy.',
    isAvailable: true,
    isDaighItem: false,
    isLowStock: false,
    kitchenStationId: '11111111-1111-1111-1111-111111111001',
    station: 'Wok / Karahi'
  },
  {
    id: '44444444-4444-4444-4444-444444444003',
    legacyId: 'item-surmai-fish',
    categoryId: 'karahi',
    name: 'Fried Surmai Fish (Karachi Batter)',
    urduName: 'تلی ہوئی سرمئی مچھلی',
    pricingType: 'per_kg',
    basePrice: 2400,
    unit: 'kg',
    minWeightKg: 0.5,
    maxWeightKg: 4.0,
    description: 'Fresh catch Arabian Sea Surmai fish coated in ajwain spicy red batter, weighed live.',
    isAvailable: true,
    isDaighItem: false,
    isLowStock: false,
    kitchenStationId: '11111111-1111-1111-1111-111111111003',
    station: 'Fryer Station'
  },

  // 3. Biryani & Daighs (Automation 2 Targets - Alert if < 5 plates!)
  {
    id: '44444444-4444-4444-4444-444444444007',
    legacyId: 'item-nalli-biryani',
    categoryId: 'biryani',
    name: 'Special Beef Nalli Biryani (Single)',
    urduName: 'اسپیشل بیف نلی بریانی',
    pricingType: 'fixed',
    basePrice: 520,
    unit: 'plate',
    isDaighItem: true,
    daighPlatesRemaining: 7, // Drops to < 5 on order (triggers alert!)
    daighTotalPlates: 35,
    lowStockThreshold: 5,
    isLowStock: false,
    description: 'Long grain super sella rice with tender beef shank and rich bone marrow.',
    kitchenStationId: '11111111-1111-1111-1111-111111111001',
    station: 'Wok / Karahi'
  },
  {
    id: '44444444-4444-4444-4444-444444444008',
    legacyId: 'item-shahi-haleem',
    categoryId: 'biryani',
    name: 'Shahi Beef Haleem (Khas Bowl)',
    urduName: 'شاہی بیف حلیم',
    pricingType: 'fixed',
    basePrice: 380,
    unit: 'bowl',
    isDaighItem: true,
    daighPlatesRemaining: 4, // Seeded with < 5 plates (LOW STOCK ACTIVE!)
    daighTotalPlates: 30,
    lowStockThreshold: 5,
    isLowStock: true,
    description: 'Garnished with caramelized brown onions, fresh julienne ginger, mint, and lemon.',
    kitchenStationId: '11111111-1111-1111-1111-111111111001',
    station: 'Wok / Karahi'
  },

  // 4. BBQ & Kabab (Station: BBQ Charcoal Grill 11111111-1111-1111-1111-111111111002)
  {
    id: '44444444-4444-4444-4444-444444444005',
    legacyId: 'item-bihari-kabab',
    categoryId: 'bbq',
    name: 'Beef Bihari Kabab (Seekh)',
    urduName: 'بیف بہاری کباب',
    pricingType: 'fixed',
    basePrice: 580,
    unit: 'seekh',
    description: 'Silky thinly sliced beef pasanda marinated with raw papaya and mustard oil.',
    isAvailable: true,
    isDaighItem: false,
    isLowStock: false,
    kitchenStationId: '11111111-1111-1111-1111-111111111002',
    station: 'BBQ Grill'
  },
  {
    id: '44444444-4444-4444-4444-444444444006',
    legacyId: 'item-malai-boti',
    categoryId: 'bbq',
    name: 'Chicken Malai Boti (Plate)',
    urduName: 'چکن ملائی بوٹی',
    pricingType: 'fixed',
    basePrice: 650,
    unit: 'plate',
    description: 'Boneless chicken breast marinated with heavy malai, green chilies, and white pepper.',
    isAvailable: true,
    isDaighItem: false,
    isLowStock: false,
    kitchenStationId: '11111111-1111-1111-1111-111111111002',
    station: 'BBQ Grill'
  },

  // 5. Tandoor & Breads (Station: Tandoor Oven 11111111-1111-1111-1111-111111111004)
  {
    id: '44444444-4444-4444-4444-444444444009',
    legacyId: 'item-roghni-naan',
    categoryId: 'tandoor',
    name: 'Special Roghni Naan',
    urduName: 'روغنی نان',
    pricingType: 'fixed',
    basePrice: 90,
    unit: 'piece',
    description: 'Fluffy tandoori bread brushed with butter ghee and toasted sesame seeds.',
    isAvailable: true,
    isDaighItem: false,
    isLowStock: false,
    kitchenStationId: '11111111-1111-1111-1111-111111111004',
    station: 'Tandoor Oven'
  },
  {
    id: '44444444-4444-4444-4444-444444444012',
    legacyId: 'item-tandoori-paratha',
    categoryId: 'tandoor',
    name: 'Crispy Tandoori Paratha',
    urduName: 'تندوری پراٹھا',
    pricingType: 'fixed',
    basePrice: 100,
    unit: 'piece',
    description: 'Layered tandoori paratha with crisp flaky crust.',
    isAvailable: true,
    isDaighItem: false,
    isLowStock: false,
    kitchenStationId: '11111111-1111-1111-1111-111111111004',
    station: 'Tandoor Oven'
  },

  // 6. Chai & Beverages (Station: Beverages 11111111-1111-1111-1111-111111111005)
  {
    id: '44444444-4444-4444-4444-444444444010',
    legacyId: 'item-karak-chai',
    categoryId: 'drinks',
    name: 'Doodh Patti Karak Chai',
    urduName: 'دودھ پتی کڑک چائے',
    pricingType: 'fixed',
    basePrice: 140,
    unit: 'cup',
    description: 'Slow-simmered rich black tea brewed purely in fresh buffalo milk.',
    isAvailable: true,
    isDaighItem: false,
    isLowStock: false,
    kitchenStationId: '11111111-1111-1111-1111-111111111005',
    station: 'Beverages'
  }
];

// Valid Pakistani Banknotes & Coinage
export const PAKISTANI_NOTES = [5000, 1000, 500, 100, 50, 20, 10, 'coins'];

// Rider Delivery Statuses
export const RIDER_STATUS = {
  AVAILABLE: 'available',
  ASSIGNED: 'assigned',
  ON_DELIVERY: 'on_delivery',
  RETURNING: 'returning',
  OFF_DUTY: 'off_duty'
};

export const INITIAL_RIDERS = [
  {
    id: '55555555-5555-5555-5555-555555555001',
    name: 'Muhammad Bilal Khan',
    phone: '0300-8291024',
    cnic: '42101-9284719-1',
    bikeNo: 'KHI-9921 (Honda 125)',
    status: RIDER_STATUS.ON_DELIVERY,
    cashSurrendered: 0,
    totalTrips: 6,
    isActive: true
  },
  {
    id: '55555555-5555-5555-5555-555555555002',
    name: 'Hamza Farooq',
    phone: '0312-4820194',
    cnic: '42201-1928401-3',
    bikeNo: 'KHI-4412 (Unique 70)',
    status: RIDER_STATUS.AVAILABLE,
    cashSurrendered: 0,
    totalTrips: 9,
    isActive: true
  },
  {
    id: '55555555-5555-5555-5555-555555555003',
    name: 'Zeeshan Ali',
    phone: '0333-5182940',
    cnic: '42301-8172948-5',
    bikeNo: 'KHI-7810 (Super Power)',
    status: RIDER_STATUS.AVAILABLE,
    cashSurrendered: 0,
    totalTrips: 4,
    isActive: true
  }
];

export const RIDERS_LIST = INITIAL_RIDERS;

export const INITIAL_RAW_INVENTORY = [
  { id: '33333333-3333-3333-3333-333333333001', sku: 'RAW-CHK-01', name: 'Prepped Broiler Chicken', unit: 'kg', currentStock: 85.0, minThreshold: 20.0 },
  { id: '33333333-3333-3333-3333-333333333002', sku: 'RAW-MUT-01', name: 'Fresh Mutton Shinwari Cut', unit: 'kg', currentStock: 42.0, minThreshold: 10.0 },
  { id: '33333333-3333-3333-3333-333333333003', sku: 'RAW-FSH-01', name: 'Fresh Surmai Fish', unit: 'kg', currentStock: 28.5, minThreshold: 8.0 },
  { id: '33333333-3333-3333-3333-333333333004', sku: 'RAW-BEEF-01', name: 'Beef Boneless Pasanda', unit: 'kg', currentStock: 35.0, minThreshold: 10.0 },
  { id: '33333333-3333-3333-3333-333333333005', sku: 'RAW-OIL-01', name: 'Cooking Oil / Banaspati Ghee', unit: 'litre', currentStock: 120.0, minThreshold: 25.0 },
  { id: '33333333-3333-3333-3333-333333333006', sku: 'RAW-TOM-01', name: 'Tomato Gravy Base', unit: 'kg', currentStock: 50.0, minThreshold: 10.0 },
  { id: '33333333-3333-3333-3333-333333333007', sku: 'RAW-FLR-01', name: 'Fine Maida Naan Dough', unit: 'kg', currentStock: 60.0, minThreshold: 15.0 },
  { id: '33333333-3333-3333-3333-333333333008', sku: 'RAW-BOX-01', name: 'Broast Packaging Boxes', unit: 'piece', currentStock: 250.0, minThreshold: 50.0 },
  { id: '33333333-3333-3333-3333-333333333009', sku: 'RAW-DAIGH-BIR-01', name: 'Special Nalli Biryani Daigh #1', unit: 'plate', currentStock: 7.0, minThreshold: 5.0, isDaigh: true },
  { id: '33333333-3333-3333-3333-333333333010', sku: 'RAW-DAIGH-HAL-01', name: 'Shahi Beef Haleem Daigh #1', unit: 'plate', currentStock: 4.0, minThreshold: 5.0, isDaigh: true },
  { id: '33333333-3333-3333-3333-333333333011', sku: 'RAW-MILK-01', name: 'Buffalo Fresh Milk', unit: 'litre', currentStock: 45.0, minThreshold: 10.0 }
];
