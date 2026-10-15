// ==============================================================================
// KARACHI EXPRESS POS — SEED & STATE DATA
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
  // Fast Food & Broast (Fixed Price)
  {
    id: 'item-broast-qtr',
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
    station: 'Fryer Station'
  },
  {
    id: 'item-broast-half',
    categoryId: 'broast',
    name: 'Half Chicken Broast (2 Pcs)',
    urduName: 'ہاف چکن بروسٹ',
    pricingType: 'fixed',
    basePrice: 1290,
    unit: 'portion',
    description: '2 Crispy Broast pieces with double fries, 2 garlic dips, and 2 buns.',
    isAvailable: true,
    isDaighItem: false,
    isLowStock: false,
    station: 'Fryer Station'
  },
  {
    id: 'item-zinger-burger',
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
    station: 'Fryer Station'
  },

  // Variable Weight Items (Shinwari & Fish - Weighed in KG!)
  {
    id: 'item-shinwari-chk',
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
    station: 'Wok / Karahi'
  },
  {
    id: 'item-shinwari-mut',
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
    station: 'Wok / Karahi'
  },
  {
    id: 'item-surmai-fish',
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
    station: 'Fryer Station'
  },

  // Biryani & Daighs (Automation 2 Targets - Alert if < 5 plates!)
  {
    id: 'item-nalli-biryani',
    categoryId: 'biryani',
    name: 'Special Beef Nalli Biryani (Plate)',
    urduName: 'اسپیشل بیف نلی بریانی',
    pricingType: 'fixed',
    basePrice: 520,
    unit: 'plate',
    isDaighItem: true,
    daighPlatesRemaining: 6, // Drops to < 5 on order!
    daighTotalPlates: 35,
    lowStockThreshold: 5,
    isLowStock: false,
    description: 'Long grain super sella rice with tender beef shank and rich bone marrow.',
    station: 'Wok / Karahi'
  },
  {
    id: 'item-chicken-biryani',
    categoryId: 'biryani',
    name: 'Chicken Dum Biryani (Double Chicken)',
    urduName: 'چکن دم بریانی',
    pricingType: 'fixed',
    basePrice: 440,
    unit: 'plate',
    isDaighItem: true,
    daighPlatesRemaining: 18,
    daighTotalPlates: 40,
    lowStockThreshold: 5,
    isLowStock: false,
    description: 'Flavorsome layered basmati rice with spiced potatoes and tender chicken.',
    station: 'Wok / Karahi'
  },
  {
    id: 'item-shahi-haleem',
    categoryId: 'biryani',
    name: 'Shahi Beef Haleem (Khas Bowl)',
    urduName: 'شاہی بیف حلیم',
    pricingType: 'fixed',
    basePrice: 380,
    unit: 'bowl',
    isDaighItem: true,
    daighPlatesRemaining: 4, // Already < 5 plates! LOW STOCK ACTIVE!
    daighTotalPlates: 30,
    lowStockThreshold: 5,
    isLowStock: true,
    description: 'Garnished with caramelized brown onions, fresh julienne ginger, mint, and lemon.',
    station: 'Wok / Karahi'
  },

  // BBQ & Kabab
  {
    id: 'item-chapli-kabab',
    categoryId: 'bbq',
    name: 'Peshawari Chapli Kabab (Large)',
    urduName: 'پشاوری چپلی کباب',
    pricingType: 'fixed',
    basePrice: 480,
    unit: 'patty',
    description: 'Juicy spiced minced beef patty with fresh tomato slices and pomegranate anardana, fried crisp.',
    isAvailable: true,
    isDaighItem: false,
    isLowStock: false,
    station: 'BBQ Grill'
  },
  {
    id: 'item-bihari-kabab',
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
    station: 'BBQ Grill'
  },
  {
    id: 'item-malai-boti',
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
    station: 'BBQ Grill'
  },
  {
    id: 'item-chicken-tikka',
    categoryId: 'bbq',
    name: 'Chicken Tikka Chest Piece',
    urduName: 'چکن تکہ سینہ',
    pricingType: 'fixed',
    basePrice: 420,
    unit: 'piece',
    description: 'Charcoal grilled chicken quarter marinated in spicy red yogurt rub.',
    isAvailable: true,
    isDaighItem: false,
    isLowStock: false,
    station: 'BBQ Grill'
  },

  // Tandoor & Breads
  {
    id: 'item-roghni-naan',
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
    station: 'Tandoor Oven'
  },
  {
    id: 'item-garlic-naan',
    categoryId: 'tandoor',
    name: 'Garlic Butter Naan',
    urduName: 'گارلک مکھن نان',
    pricingType: 'fixed',
    basePrice: 120,
    unit: 'piece',
    description: 'Infused with roasted garlic cloves and fresh coriander.',
    isAvailable: true,
    isDaighItem: false,
    isLowStock: false,
    station: 'Tandoor Oven'
  },
  {
    id: 'item-tandoori-paratha',
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
    station: 'Tandoor Oven'
  },

  // Chai & Drinks
  {
    id: 'item-karak-chai',
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
    station: 'Beverages'
  },
  {
    id: 'item-pakola-float',
    categoryId: 'drinks',
    name: 'Pakola Ice Cream Float',
    urduName: 'پاکولا آئس کریم فلوٹ',
    pricingType: 'fixed',
    basePrice: 220,
    unit: 'glass',
    description: 'Karachi legacy green cream soda topped with a scoop of vanilla ice cream.',
    isAvailable: true,
    isDaighItem: false,
    isLowStock: false,
    station: 'Beverages'
  },
  {
    id: 'item-fresh-lime',
    categoryId: 'drinks',
    name: 'Mint Fresh Lime 7Up',
    urduName: 'منٹ فریش لائم',
    pricingType: 'fixed',
    basePrice: 180,
    unit: 'glass',
    description: 'Crushed mint, black rock salt, freshly squeezed lime, and chilled soda.',
    isAvailable: true,
    isDaighItem: false,
    isLowStock: false,
    station: 'Beverages'
  }
];

export const PAKISTANI_NOTES = [5000, 1000, 500, 100, 75, 50, 20, 10, 'coins'];

export const RIDERS_LIST = [
  { id: 'r1', name: 'Muhammad Bilal (Bike KHI-9921)', phone: '0300-8291024' },
  { id: 'r2', name: 'Hamza Farooq (Bike KHI-4412)', phone: '0312-4820194' },
  { id: 'r3', name: 'Zeeshan Ali (Bike KHI-7810)', phone: '0333-5182940' }
];

export const DEMO_MANAGERS = [
  { name: 'Shahmeer Khan (General Manager)', pin: '7860' },
  { name: 'Tariq Mehmood (Shift Supervisor)', pin: '1234' }
];
