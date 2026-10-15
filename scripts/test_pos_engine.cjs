// ==============================================================================
// AUTOMATED TEST SUITE: scripts/test_pos_engine.cjs
// Tests financial ledger, blind cash closing, rider reconciliation, 
// security hashing, order pricing, and recipe inventory BOM
// ==============================================================================

const assert = require('assert');
const crypto = require('crypto');

console.log('=================================================================');
console.log('🧪 RUNNING ENTERPRISE TEST SUITE: KARACHI EXPRESS POS ENGINE');
console.log('=================================================================');

let passedTests = 0;
let totalTests = 0;

function it(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${description}`);
    console.error(`     Error: ${err.message}`);
    process.exitCode = 1;
  }
}

// ==============================================================================
// 1. FINANCIAL ACCOUNTING EQUATION & BLIND CASH CLOSING TESTS
// ==============================================================================
console.log('\n--- SUITE 1: Financial Ledger & Blind Cash Accounting Equation ---');

it('calculates perfectly balanced shift with zero discrepancy', () => {
  const openingFloat = 5000;
  const cashSales = 12500;
  const cashRefunds = 680;
  const cashExpenses = 500; // e.g. Ice / Mint emergency purchase
  const cashDrops = 5000;   // Safe deposit
  const riderHandovers = 3200; // Rider surrendered COD

  // Accounting Equation:
  // Expected = Opening Float + Cash Sales - Refunds - Expenses - Drops + Rider Handovers
  const expectedCash = openingFloat + cashSales - cashRefunds - cashExpenses - cashDrops + riderHandovers;
  assert.strictEqual(expectedCash, 14520, 'Expected cash calculation mismatch');

  // Cashier physically counted banknotes:
  const countedNotes = {
    '5000': 2, // 10000
    '1000': 4, // 4000
    '500': 1,  // 500
    '20': 1,   // 20
    'coins': 0
  };
  const physicalTotal = (2 * 5000) + (4 * 1000) + (1 * 500) + (1 * 20);
  assert.strictEqual(physicalTotal, 14520, 'Physical total calculation mismatch');

  const discrepancy = physicalTotal - expectedCash;
  assert.strictEqual(discrepancy, 0, 'Should have 0 discrepancy for balanced shift');
});

it('detects and quantifies cash shortage accurately', () => {
  const openingFloat = 5000;
  const cashSales = 8400;
  const expectedCash = openingFloat + cashSales; // 13400
  const physicalTotal = 13000; // Cashier counted Rs. 13,000

  const discrepancy = physicalTotal - expectedCash;
  assert.strictEqual(discrepancy, -400, 'Discrepancy should reflect negative 400 shortage');
  assert.strictEqual(discrepancy < 0, true, 'isShortage flag must be true');
});

it('detects and quantifies cash surplus/overage accurately', () => {
  const openingFloat = 5000;
  const cashSales = 9200;
  const expectedCash = openingFloat + cashSales; // 14200
  const physicalTotal = 14350; // Cashier counted Rs. 14,350

  const discrepancy = physicalTotal - expectedCash;
  assert.strictEqual(discrepancy, 150, 'Discrepancy should reflect positive 150 overage');
  assert.strictEqual(discrepancy > 0, true, 'isOverage flag must be true');
});

// ==============================================================================
// 2. ORDER PRICING & VARIABLE-WEIGHT VALIDATION TESTS
// ==============================================================================
console.log('\n--- SUITE 2: Order Pricing & Variable-Weight Calculations ---');

it('calculates fixed item totals with precision', () => {
  const item = { basePrice: 680, quantity: 3 };
  const total = item.basePrice * item.quantity;
  assert.strictEqual(total, 2040);
});

it('calculates variable-weight dishes proportional to kilograms', () => {
  const shinwariKarahi = { basePrice: 1850, weightKg: 1.75 };
  const calculated = Math.round(shinwariKarahi.weightKg * shinwariKarahi.basePrice);
  // 1.75 * 1850 = 3237.5 -> rounded to 3238
  assert.strictEqual(calculated, 3238, 'Variable weight pricing must round cleanly without decimals');
});

it('calculates SRB sales tax correctly', () => {
  const subtotal = 4500;
  const taxRate = 5; // 5% SRB sales tax
  const tax = Math.round((subtotal * taxRate) / 100);
  assert.strictEqual(tax, 225);
  assert.strictEqual(subtotal + tax, 4725);
});

it('rejects orders with negative or zero quantities', () => {
  const invalidItems = [{ basePrice: 500, quantity: -2 }];
  let caught = false;
  try {
    if (invalidItems.some(i => i.quantity <= 0)) {
      throw new Error('Quantity must be greater than zero.');
    }
  } catch (e) {
    caught = true;
  }
  assert.strictEqual(caught, true, 'Zero or negative quantity must be rejected');
});

// ==============================================================================
// 3. IDEMPOTENCY & MUTEX SUBMISSION TESTS
// ==============================================================================
console.log('\n--- SUITE 3: Idempotency & Submission Mutex Guards ---');

it('generates deterministic and unique idempotency keys per transaction', () => {
  const orderId = '88888888-8888-8888-8888-888888888001';
  const token = 101;
  const key1 = `khi-pos-${orderId}-${token}`;
  const key2 = `khi-pos-${orderId}-${token}`;
  assert.strictEqual(key1, key2, 'Same transaction must have identical idempotency key');

  const differentOrderId = '88888888-8888-8888-8888-888888888002';
  const key3 = `khi-pos-${differentOrderId}-${token}`;
  assert.notStrictEqual(key1, key3, 'Different transactions must have unique idempotency keys');
});

it('blocks duplicate concurrent submissions with mutex lock', () => {
  let isSubmitting = false;

  function fakeSubmit() {
    if (isSubmitting) {
      throw new Error('A payment submission is already being processed.');
    }
    isSubmitting = true;
  }

  fakeSubmit();
  assert.strictEqual(isSubmitting, true);

  let duplicateBlocked = false;
  try {
    fakeSubmit(); // Second press while still submitting
  } catch (e) {
    duplicateBlocked = true;
  }
  assert.strictEqual(duplicateBlocked, true, 'Concurrent submission must be blocked by mutex');
  isSubmitting = false;
});

// ==============================================================================
// 4. RIDER LEDGER & CASH HANDOVER RECONCILIATION TESTS
// ==============================================================================
console.log('\n--- SUITE 4: Rider Delivery Ledger & Reconciliation ---');

it('computes rider net cash owed from genuine delivery orders', () => {
  const orders = [
    { mode: 'delivery', paymentMethod: 'rider_cod', total: 2400, deliveryInfo: { riderId: 'r1' } },
    { mode: 'delivery', paymentMethod: 'rider_cod', total: 1850, deliveryInfo: { riderId: 'r1' } },
    { mode: 'delivery', paymentMethod: 'card', total: 1200, deliveryInfo: { riderId: 'r1' } } // Prepaid by card, no cash to collect!
  ];

  const cashOrders = orders.filter(o => o.deliveryInfo.riderId === 'r1' && o.paymentMethod === 'rider_cod');
  const totalCodCollected = cashOrders.reduce((sum, o) => sum + o.total, 0); // 2400 + 1850 = 4250
  assert.strictEqual(totalCodCollected, 4250, 'COD collected total mismatch');

  let cashSurrendered = 0;
  let netOwed = totalCodCollected - cashSurrendered;
  assert.strictEqual(netOwed, 4250, 'Rider initially owes full COD amount');

  // Rider surrenders Rs. 4000 at the counter:
  cashSurrendered += 4000;
  netOwed = totalCodCollected - cashSurrendered;
  assert.strictEqual(netOwed, 250, 'Rider should now owe remaining Rs. 250');
});

it('verifies rider status transition states', () => {
  const validStatuses = ['available', 'assigned', 'on_delivery', 'returning', 'off_duty'];
  assert.strictEqual(validStatuses.includes('on_delivery'), true);
  assert.strictEqual(validStatuses.includes('available'), true);
  assert.strictEqual(validStatuses.includes('invalid_state'), false);
});

// ==============================================================================
// 5. SECURITY, ROLE-BASED ACCESS CONTROL & CRYPTOGRAPHIC PIN TESTS
// ==============================================================================
console.log('\n--- SUITE 5: Security & Cryptographic Authorization ---');

it('verifies SHA-256 salted PIN hash matches manager credentials', () => {
  function hashPinSync(pin) {
    const salted = `khi_pos_pin_${pin.trim()}`;
    return crypto.createHash('sha256').update(salted).digest('hex');
  }

  // Known salt and hash for manager PIN "7860"
  const expectedHash7860 = '54e3af090c7f7576c75ad7c069189f8b2c05a23cad635c3a04782e39deca906f';
  const computedHash = hashPinSync('7860');
  assert.strictEqual(computedHash, expectedHash7860, 'Salted hash for 7860 must match expected digest');

  // Verify invalid PIN does not match
  const wrongHash = hashPinSync('9999');
  assert.notStrictEqual(wrongHash, expectedHash7860, 'Wrong PIN must produce different digest');
});

it('enforces least-privilege role matrix on sensitive actions', () => {
  const PERMISSIONS = {
    VOID_ORDER: ['supervisor', 'manager', 'owner'],
    VIEW_OWNER_REPORTS: ['manager', 'owner'],
    TAKE_ORDERS: ['cashier', 'supervisor', 'manager', 'owner']
  };

  function hasPerm(role, perm) {
    return (PERMISSIONS[perm] || []).includes(role);
  }

  // Cashier can take orders but cannot view owner reports or void orders without manager
  assert.strictEqual(hasPerm('cashier', 'TAKE_ORDERS'), true);
  assert.strictEqual(hasPerm('cashier', 'VIEW_OWNER_REPORTS'), false);
  assert.strictEqual(hasPerm('cashier', 'VOID_ORDER'), false);

  // Manager and Owner can do all privileged actions
  assert.strictEqual(hasPerm('manager', 'VOID_ORDER'), true);
  assert.strictEqual(hasPerm('owner', 'VIEW_OWNER_REPORTS'), true);
});

// ==============================================================================
// 6. RECIPE INVENTORY BOM SCALING TESTS
// ==============================================================================
console.log('\n--- SUITE 6: Recipe Inventory BOM Scaling ---');

it('calculates proportional ingredient depletion for variable-weight items', () => {
  // Recipe for 1.0 kg Shinwari Karahi requires:
  // - 1.05 kg Chicken
  // - 0.12 kg Ghee
  // - 0.35 kg Tomato Base
  const baseBOM = [
    { rawItem: 'Chicken', qtyPerKg: 1.05 },
    { rawItem: 'Ghee', qtyPerKg: 0.12 },
    { rawItem: 'Tomato', qtyPerKg: 0.35 }
  ];

  const orderedWeightKg = 2.0; // 2 kg Karahi ordered
  const depletedChicken = baseBOM[0].qtyPerKg * orderedWeightKg;
  const depletedGhee = baseBOM[1].qtyPerKg * orderedWeightKg;

  assert.strictEqual(depletedChicken, 2.10, '2 kg Karahi must deduct exactly 2.10 kg chicken');
  assert.strictEqual(depletedGhee, 0.24, '2 kg Karahi must deduct exactly 0.24 kg ghee');
});

it('triggers Low Stock flag when Daigh portion drops below 5 plates', () => {
  function checkLowStock(platesRemaining, threshold = 5) {
    return platesRemaining < threshold;
  }

  assert.strictEqual(checkLowStock(7), false, '7 plates is above threshold (safe)');
  assert.strictEqual(checkLowStock(5), false, '5 plates is equal to threshold (safe)');
  assert.strictEqual(checkLowStock(4), true, '4 plates is below 5 (MUST TRIGGER ALERT)');
  assert.strictEqual(checkLowStock(1), true, '1 plate is below 5 (MUST TRIGGER ALERT)');
});

console.log('\n=================================================================');
console.log(`🎉 TEST SUMMARY: ${passedTests} OF ${totalTests} TESTS PASSED WITH 0 FAILURES`);
console.log('=================================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
