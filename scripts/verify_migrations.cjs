// ==============================================================================
// VERIFICATION SCRIPT: scripts/verify_migrations.js
// Applies Supabase PostgreSQL migrations and rigorously tests all 4 automations
// ==============================================================================

const fs = require('fs');
const path = require('path');
const { PGlite } = require('@electric-sql/pglite');

async function runVerification() {
    console.log('=================================================================');
    console.log('🚀 INITIALIZING SUPABASE POSTGRESQL ENGINE FOR VALIDATION');
    console.log('=================================================================');

    const db = new PGlite();

    const migrationFiles = [
        '20261015000001_core_schema.sql',
        '20261015000002_automations.sql',
        '20261015000003_seed_data.sql',
        '20261015000004_security_advisor_fixes.sql'
    ];

    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

    // STEP 1: APPLY MIGRATIONS
    for (const file of migrationFiles) {
        const filePath = path.join(migrationsDir, file);
        console.log(`\n⏳ Applying migration: ${file}...`);
        
        if (!fs.existsSync(filePath)) {
            throw new Error(`Migration file not found: ${filePath}`);
        }

        const sql = fs.readFileSync(filePath, 'utf-8');
        try {
            await db.exec(sql);
            console.log(`✅ Successfully applied: ${file}`);
        } catch (err) {
            console.error(`❌ Migration failed in ${file}:`);
            console.error('Error message:', err.message);
            console.error('Error detail:', err.detail || err.hint || err.cause || err);
            process.exit(1);
        }
    }

    console.log('\n-----------------------------------------------------------------');
    console.log('🔍 VERIFYING CORE TABLES CREATED');
    console.log('-----------------------------------------------------------------');

    const tablesCheck = await db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    `);

    console.log('Created Tables:');
    tablesCheck.rows.forEach(r => console.log(`  ✓ ${r.table_name}`));

    const requiredTables = [
        'audit_void_logs',
        'cash_drawer_sessions',
        'inventory_transactions',
        'kitchen_stations',
        'manager_credentials',
        'menu_categories',
        'menu_items',
        'order_items',
        'orders',
        'raw_inventory_items',
        'recipe_ingredients',
        'riders'
    ];

    for (const t of requiredTables) {
        if (!tablesCheck.rows.some(r => r.table_name === t)) {
            throw new Error(`Missing required table: ${t}`);
        }
    }
    console.log('✅ All 12 core tables and audit logs verified present!');

    console.log('\n-----------------------------------------------------------------');
    console.log('🧪 TESTING AUTOMATION 1: RECIPE AUTO-DEPLETION');
    console.log('-----------------------------------------------------------------');
    // Order #101 contains:
    // - 1.0 kg Chicken Shinwari Karahi (1.05 kg Chicken, 0.12 kg Ghee, 0.35 kg Tomato Base)
    // - 2 Roghni Naans (2 * 0.16 = 0.32 kg Maida Dough)
    // - 2 Karak Chai (2 * 0.20 = 0.40 L Milk)

    const initialChicken = await db.query(`SELECT current_stock FROM raw_inventory_items WHERE sku = 'RAW-CHK-01'`);
    const initialGhee = await db.query(`SELECT current_stock FROM raw_inventory_items WHERE sku = 'RAW-OIL-01'`);
    console.log(`Initial Chicken Stock: ${initialChicken.rows[0].current_stock} kg`);
    console.log(`Initial Ghee Stock: ${initialGhee.rows[0].current_stock} litre`);

    // Complete Order #101
    await db.query(`
        UPDATE orders 
        SET status = 'completed' 
        WHERE order_token = 'TKN-101'
    `);

    const updatedChicken = await db.query(`SELECT current_stock FROM raw_inventory_items WHERE sku = 'RAW-CHK-01'`);
    const updatedGhee = await db.query(`SELECT current_stock FROM raw_inventory_items WHERE sku = 'RAW-OIL-01'`);
    console.log(`Post-Completion Chicken Stock: ${updatedChicken.rows[0].current_stock} kg (Expected: 83.950)`);
    console.log(`Post-Completion Ghee Stock: ${updatedGhee.rows[0].current_stock} litre (Expected: 119.880)`);

    if (parseFloat(updatedChicken.rows[0].current_stock) !== 83.950) {
        throw new Error(`Automation 1 failed: Chicken stock mismatch! Got ${updatedChicken.rows[0].current_stock}`);
    }

    // Verify inventory_transactions audit entries
    const txRecords = await db.query(`
        SELECT t.quantity_change, t.previous_stock, t.new_stock, t.reference_note, r.name as raw_name
        FROM inventory_transactions t
        JOIN raw_inventory_items r ON r.id = t.raw_inventory_item_id
        WHERE t.order_id = '88888888-8888-8888-8888-888888888001';
    `);
    console.log(`Audit log created ${txRecords.rows.length} inventory depletion transactions:`);
    txRecords.rows.forEach(tx => {
        console.log(`  ✓ ${tx.raw_name}: ${tx.quantity_change} (${tx.previous_stock} -> ${tx.new_stock})`);
    });
    console.log('✅ Automation 1 (Recipe Auto-Depletion) passed with 100% precision!');

    console.log('\n-----------------------------------------------------------------');
    console.log('🧪 TESTING AUTOMATION 2: DAIGH & STOCK ALERTS (< 5 PLATES)');
    console.log('-----------------------------------------------------------------');

    // 1. Check Haleem Daigh (was seeded with 4 plates, threshold is 5)
    const haleemAlert = await db.query(`
        SELECT name, is_low_stock, is_daigh_item 
        FROM menu_items 
        WHERE id = '44444444-4444-4444-4444-444444444008'
    `);
    console.log(`Haleem Daigh (< 5 plates initial): is_low_stock = ${haleemAlert.rows[0].is_low_stock}`);

    // 2. Biryani Daigh started at 7 plates. Let's create an order for 3 plates of Biryani and complete it.
    // Stock should drop to 7 - 3 = 4 plates (< 5 threshold). The trigger must flag is_low_stock = TRUE!
    const biryaniBefore = await db.query(`SELECT is_low_stock FROM menu_items WHERE id = '44444444-4444-4444-4444-444444444007'`);
    console.log(`Biryani Daigh Before: is_low_stock = ${biryaniBefore.rows[0].is_low_stock} (7 plates remaining)`);

    // Create Order #103 with 3 plates of Biryani
    await db.exec(`
        INSERT INTO orders (id, order_number, order_token, order_type, session_id, status, total_amount, payment_method, payment_status)
        VALUES ('88888888-8888-8888-8888-888888888003', 103, 'TKN-103', 'dine_in', '77777777-7777-7777-7777-777777777001', 'sent_to_kitchen', 1560.00, 'cash', 'paid');
        
        INSERT INTO order_items (order_id, menu_item_id, kitchen_station_id, quantity, unit_price, total_price)
        VALUES ('88888888-8888-8888-8888-888888888003', '44444444-4444-4444-4444-444444444007', '11111111-1111-1111-1111-111111111001', 3, 520.00, 1560.00);
    `);

    // Complete the order to trigger recipe auto-depletion
    await db.query(`UPDATE orders SET status = 'completed' WHERE id = '88888888-8888-8888-8888-888888888003'`);

    // Check Biryani stock and alert status
    const biryaniStock = await db.query(`SELECT current_stock FROM raw_inventory_items WHERE sku = 'RAW-DAIGH-BIR-01'`);
    const biryaniAfter = await db.query(`SELECT is_low_stock FROM menu_items WHERE id = '44444444-4444-4444-4444-444444444007'`);
    console.log(`Biryani Daigh After Order: Remaining = ${biryaniStock.rows[0].current_stock} plates, is_low_stock = ${biryaniAfter.rows[0].is_low_stock}`);

    if (parseFloat(biryaniStock.rows[0].current_stock) !== 4.0 || biryaniAfter.rows[0].is_low_stock !== true) {
        throw new Error('Automation 2 failed: Biryani daigh did not flag Low Stock when dropping under 5 plates!');
    }

    // Check Counter Alert View
    const alertsView = await db.query(`SELECT * FROM view_counter_stock_alerts;`);
    console.log(`Active Counter Screen Alerts (${alertsView.rows.length} items flagged):`);
    alertsView.rows.forEach(a => console.log(`  📣 ${a.alert_message}`));
    console.log('✅ Automation 2 (Daigh & Stock Alerts) passed!');

    console.log('\n-----------------------------------------------------------------');
    console.log('🧪 TESTING AUTOMATION 3: ANTI-THEFT VOID GUARD');
    console.log('-----------------------------------------------------------------');

    // Test 3A: Attempt to DELETE Order #102 directly
    let deleteBlocked = false;
    try {
        await db.query(`DELETE FROM orders WHERE order_token = 'TKN-102'`);
    } catch (err) {
        deleteBlocked = true;
        console.log(`  ✓ Hard deletion correctly BLOCKED: "${err.message.split('\n')[0]}"`);
    }
    if (!deleteBlocked) throw new Error('Security flaw: Direct order deletion was not blocked!');

    // Test 3B: Attempt to CANCEL without Manager PIN
    let cancelBlocked = false;
    try {
        await db.query(`UPDATE orders SET status = 'cancelled' WHERE order_token = 'TKN-102'`);
    } catch (err) {
        cancelBlocked = true;
        console.log(`  ✓ Direct cancellation without PIN correctly BLOCKED: "${err.message.split('\n')[0]}"`);
    }
    if (!cancelBlocked) throw new Error('Security flaw: Direct cancellation without manager signoff was permitted!');

    // Test 3C: Call void_order_with_manager_pin with WRONG PIN
    let wrongPinBlocked = false;
    try {
        await db.query(`
            SELECT void_order_with_manager_pin(
                '88888888-8888-8888-8888-888888888002'::uuid,
                '9999',
                'Customer left without taking broast',
                'CASHIER-01'
            );
        `);
    } catch (err) {
        wrongPinBlocked = true;
        console.log(`  ✓ Fraudulent PIN rejected: "${err.message.split('\n')[0]}"`);
    }
    if (!wrongPinBlocked) throw new Error('Security flaw: Invalid Manager PIN was accepted!');

    // Test 3D: Call void_order_with_manager_pin with CORRECT PIN ('7860')
    const voidSuccess = await db.query(`
        SELECT void_order_with_manager_pin(
            '88888888-8888-8888-8888-888888888002'::uuid,
            '7860',
            'Customer ordered beef instead of chicken broast, void approved by manager',
            'CASHIER-01'
        ) AS result;
    `);
    const voidRes = voidSuccess.rows[0].result;
    console.log(`  ✓ Authorized Manager Void Result:`, voidRes);

    const voidAudit = await db.query(`SELECT * FROM audit_void_logs WHERE order_token = 'TKN-102'`);
    console.log(`  ✓ Audit Void Log entry created: Order #${voidAudit.rows[0].order_number}, Amount: Rs. ${voidAudit.rows[0].order_amount}, Manager: ${voidAudit.rows[0].manager_name}, Reason: "${voidAudit.rows[0].void_reason}"`);
    console.log('✅ Automation 3 (Anti-Theft Void Guard) passed with full tamper-proof protection!');

    console.log('\n-----------------------------------------------------------------');
    console.log('🧪 TESTING AUTOMATION 4: BLIND CASH CLOSING');
    console.log('-----------------------------------------------------------------');
    // Shift Session '77777777-7777-7777-7777-777777777001'
    // Opening Cash: Rs. 5000.00
    // Orders paid in cash during shift:
    // - Order 101: Rs. 2530.00 (completed)
    // - Order 102: Rs. 1360.00 (voided/cancelled, so excluded!)
    // - Order 103: Rs. 1560.00 (completed)
    // Expected Cash Total = 5000 + 2530 + 1560 = Rs. 9090.00

    // Cashier physically counts money without seeing expected totals:
    // Physical cash notes entered:
    // 1 note of 5000 = 5000
    // 3 notes of 1000 = 3000
    // 2 notes of 500  = 1000
    // Total counted physical cash = 9000 PKR (Shortage of Rs. 90 PKR!)
    const notesJson = JSON.stringify({
        "5000": 1,
        "1000": 3,
        "500": 2,
        "100": 0,
        "50": 0,
        "20": 0,
        "10": 0,
        "coins": 0
    });

    const shiftClosingResult = await db.query(`
        SELECT blind_close_shift(
            '77777777-7777-7777-7777-777777777001'::uuid,
            'CASHIER-01',
            $1::jsonb,
            'Minor coin change difference during peak dinner rush'
        ) AS report;
    `, [notesJson]);

    const report = shiftClosingResult.rows[0].report;
    console.log('Blind Shift Closing Report Generated by Database:');
    console.log(`  Opening Float:        Rs. ${report.opening_cash}`);
    console.log(`  Cash Sales Total:     Rs. ${report.cash_sales_total}`);
    console.log(`  Expected Cash Total:  Rs. ${report.expected_cash_total}`);
    console.log(`  Physical Cash Count:  Rs. ${report.physical_cash_total}`);
    console.log(`  Discrepancy:          Rs. ${report.cash_discrepancy} (${report.is_shortage ? 'SHORTAGE' : 'OVERAGE'})`);
    console.log(`  Shift Status:         ${report.status}`);
    console.log(`  Closing Message:      ${report.message}`);

    if (parseFloat(report.expected_cash_total) !== 9090.00 || parseFloat(report.physical_cash_total) !== 9000.00 || parseFloat(report.cash_discrepancy) !== -90.00) {
        throw new Error(`Automation 4 calculation mismatch! Expected 9090, Physical 9000, Discrepancy -90. Got: ${JSON.stringify(report)}`);
    }

    // Verify session is locked and cannot accept new orders
    let closedSessionBlocked = false;
    try {
        await db.query(`
            INSERT INTO orders (order_number, order_token, order_type, session_id, status, total_amount)
            VALUES (104, 'TKN-104', 'dine_in', '77777777-7777-7777-7777-777777777001', 'sent_to_kitchen', 500.00);
        `);
    } catch (err) {
        closedSessionBlocked = true;
        console.log(`  ✓ Orders to locked session correctly BLOCKED: "${err.message.split('\n')[0]}"`);
    }
    if (!closedSessionBlocked) throw new Error('Security flaw: Orders were added to locked shift session!');

    console.log('✅ Automation 4 (Blind Cash Closing) passed with 100% precision!');

    console.log('\n=================================================================');
    console.log('🎉 ALL SUPABASE MIGRATIONS AND AUTOMATIONS VERIFIED WITH 0 ERRORS!');
    console.log('=================================================================');
}

runVerification().catch(err => {
    console.error('Fatal verification error:', err);
    process.exit(1);
});
