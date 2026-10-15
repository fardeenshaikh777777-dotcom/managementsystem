-- ==============================================================================
-- MIGRATION: 20261015000003_seed_data.sql
-- High-Volume Traditional Restaurant Management System (Karachi Edition)
-- Authentic Seed Data for Karachi Outlets
-- ==============================================================================

-- 1. KITCHEN STATIONS
INSERT INTO kitchen_stations (id, name, code, description, display_order, printer_ip) VALUES
('11111111-1111-1111-1111-111111111001', 'Wok / Karahi Station', 'KITCHEN_WOK', 'High flame burners for Shinwari, Koyla Karahi, Handi', 1, '192.168.1.101'),
('11111111-1111-1111-1111-111111111002', 'BBQ Charcoal Grill', 'KITCHEN_BBQ', 'Tikka, Seekh Kabab, Bihari Kabab, Sajji', 2, '192.168.1.102'),
('11111111-1111-1111-1111-111111111003', 'Deep Fryer Station', 'KITCHEN_FRYER', 'Karachi Quarter Broast, Finger Fish, Crispy Fries', 3, '192.168.1.103'),
('11111111-1111-1111-1111-111111111004', 'Tandoor Oven', 'KITCHEN_TANDOOR', 'Roghni Naan, Garlic Naan, Tandoori Paratha', 4, '192.168.1.104'),
('11111111-1111-1111-1111-111111111005', 'Beverages & Desserts', 'KITCHEN_BEV', 'Doodh Patti Karak Chai, Pakola Soda, Rabri Kheer', 5, '192.168.1.105')
ON CONFLICT (code) DO NOTHING;

-- 2. MENU CATEGORIES
INSERT INTO menu_categories (id, name, urdu_name, slug, default_kitchen_station_id, display_order) VALUES
('22222222-2222-2222-2222-222222222001', 'Karahi & Shinwari', 'کڑاہی اور شنواری', 'karahi-shinwari', '11111111-1111-1111-1111-111111111001', 1),
('22222222-2222-2222-2222-222222222002', 'BBQ & Kabab', 'بار بی کیو اور کباب', 'bbq-kabab', '11111111-1111-1111-1111-111111111002', 2),
('22222222-2222-2222-2222-222222222003', 'Broast & Fast Food', 'بروسٹ اور فاسٹ فوڈ', 'broast-fastfood', '11111111-1111-1111-1111-111111111003', 3),
('22222222-2222-2222-2222-222222222004', 'Biryani & Daighs', 'بریانی اور دیگیں', 'biryani-daighs', '11111111-1111-1111-1111-111111111001', 4),
('22222222-2222-2222-2222-222222222005', 'Tandoor & Breads', 'تندور اور نان', 'tandoor-breads', '11111111-1111-1111-1111-111111111004', 5),
('22222222-2222-2222-2222-222222222006', 'Chai & Beverages', 'چائے اور مشروبات', 'chai-beverages', '11111111-1111-1111-1111-111111111005', 6)
ON CONFLICT (slug) DO NOTHING;

-- 3. RAW INVENTORY ITEMS
-- Notice: Biryani Daigh #1 has 7 plates remaining (close to threshold)
-- Haleem Daigh #1 has 4 plates remaining (triggers Automation 2 Alert: < 5 plates!)
INSERT INTO raw_inventory_items (id, sku, name, urdu_name, category, unit, current_stock, minimum_threshold, cost_per_unit, is_daigh_batch, daigh_batch_number) VALUES
('33333333-3333-3333-3333-333333333001', 'RAW-CHK-01', 'Prepped Broiler Chicken', 'صاف شدہ چکن گوشت', 'Meat & Poultry', 'kg', 85.000, 20.000, 680.00, FALSE, NULL),
('33333333-3333-3333-3333-333333333002', 'RAW-MUT-01', 'Fresh Mutton Shinwari Cut', 'تازہ مٹن شنواری کٹ', 'Meat & Poultry', 'kg', 42.000, 10.000, 1850.00, FALSE, NULL),
('33333333-3333-3333-3333-333333333003', 'RAW-FSH-01', 'Fresh Surmai Fish', 'تازہ سرمئی مچھلی', 'Seafood', 'kg', 28.500, 8.000, 1400.00, FALSE, NULL),
('33333333-3333-3333-3333-333333333004', 'RAW-BEEF-01', 'Beef Boneless Pasanda', 'بیف پسندا بغیر ہڈی', 'Meat & Poultry', 'kg', 35.000, 10.000, 950.00, FALSE, NULL),
('33333333-3333-3333-3333-333333333005', 'RAW-OIL-01', 'Cooking Oil / Banaspati Ghee', 'کوکنگ آئل / گھی', 'Oil & Ghee', 'litre', 120.000, 25.000, 480.00, FALSE, NULL),
('33333333-3333-3333-3333-333333333006', 'RAW-TOM-01', 'Tomato & Shinwari Salt Gravy', 'ٹماٹر اور مسالہ گریوی', 'Pantry & Spices', 'kg', 50.000, 10.000, 160.00, FALSE, NULL),
('33333333-3333-3333-3333-333333333007', 'RAW-FLR-01', 'Fine Maida Naan Dough', 'میدہ گندھا ہوا آٹا', 'Bakery & Flour', 'kg', 60.000, 15.000, 180.00, FALSE, NULL),
('33333333-3333-3333-3333-333333333008', 'RAW-BOX-01', 'Broast Packaging Boxes', 'بروسٹ ڈبہ', 'Packaging', 'piece', 250.000, 50.000, 25.00, FALSE, NULL),
('33333333-3333-3333-3333-333333333009', 'RAW-DAIGH-BIR-01', 'Special Nalli Biryani Daigh #1', 'دیگ نمبر 1 نلی بریانی', 'Prepared Daigh', 'plate', 7.000, 5.000, 220.00, TRUE, 'BIRYANI-POT-01'),
('33333333-3333-3333-3333-333333333010', 'RAW-DAIGH-HAL-01', 'Shahi Beef Haleem Daigh #1', 'دیگ شاہی بیف حلیم', 'Prepared Daigh', 'plate', 4.000, 5.000, 180.00, TRUE, 'HALEEM-POT-01'),
('33333333-3333-3333-3333-333333333011', 'RAW-MILK-01', 'Buffalo Fresh Milk (Doodh Patti)', 'بھینس کا تازہ دودھ', 'Dairy', 'litre', 45.000, 10.000, 220.00, FALSE, NULL)
ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock;

-- 4. MENU ITEMS
INSERT INTO menu_items (id, category_id, kitchen_station_id, name, urdu_name, description, pricing_type, base_price, min_weight_kg, max_weight_kg, is_daigh_item, daigh_capacity_plates, low_stock_threshold, is_low_stock) VALUES
-- Variable weight items: priced per kg!
('44444444-4444-4444-4444-444444444001', '22222222-2222-2222-2222-222222222001', '11111111-1111-1111-1111-111111111001', 
 'Chicken Shinwari Karahi', 'شنواری چکن کڑاہی', 'Traditional Highway style with tomatoes and green chilies. Weighed fresh.', 'per_kg', 1850.00, 0.500, 5.000, FALSE, 0, 5.0, FALSE),

('44444444-4444-4444-4444-444444444002', '22222222-2222-2222-2222-222222222001', '11111111-1111-1111-1111-111111111001', 
 'Mutton Koyla Karahi', 'کوئلہ مٹن کڑاہی', 'Fresh baby goat cuts cooked on live coal wok.', 'per_kg', 3600.00, 0.500, 5.000, FALSE, 0, 3.0, FALSE),

('44444444-4444-4444-4444-444444444003', '22222222-2222-2222-2222-222222222003', '11111111-1111-1111-1111-111111111003', 
 'Fried Surmai Fish', 'تلی ہوئی سرمئی مچھلی', 'Fresh Arabian Sea Surmai fish coated in Karachi spicy batter, weighed per kg.', 'per_kg', 2400.00, 0.500, 4.000, FALSE, 0, 4.0, FALSE),

-- Fixed price items:
('44444444-4444-4444-4444-444444444004', '22222222-2222-2222-2222-222222222003', '11111111-1111-1111-1111-111111111003', 
 'Quarter Chicken Broast (Crispy)', 'کوآرٹر چکن بروسٹ', 'Iconic Karachi crispy quarter chicken with garlic dip, fries, and bun.', 'fixed', 680.00, NULL, NULL, FALSE, 0, 10.0, FALSE),

('44444444-4444-4444-4444-444444444005', '22222222-2222-2222-2222-222222222002', '11111111-1111-1111-1111-111111111002', 
 'Beef Bihari Kabab (Seekh)', 'بیف بہاری کباب', 'Melt-in-mouth beef pasanda marinated in raw papaya and mustard oil.', 'fixed', 580.00, NULL, NULL, FALSE, 0, 8.0, FALSE),

('44444444-4444-4444-4444-444444444006', '22222222-2222-2222-2222-222222222002', '11111111-1111-1111-1111-111111111002', 
 'Chicken Malai Boti (Plate)', 'چکن ملائی بوٹی', 'Tender boneless chicken breast marinated with fresh cream and mild spices.', 'fixed', 650.00, NULL, NULL, FALSE, 0, 8.0, FALSE),

-- Daigh Items (Automation 2 targets):
('44444444-4444-4444-4444-444444444007', '22222222-2222-2222-2222-222222222004', '11111111-1111-1111-1111-111111111001', 
 'Special Beef Nalli Biryani (Single)', 'اسپیشل بیف نلی بریانی', 'Fragrant sella rice with tender beef shank and marrow nalli, served from live daigh.', 'per_plate_daigh', 520.00, NULL, NULL, TRUE, 35, 5.0, FALSE),

('44444444-4444-4444-4444-444444444008', '22222222-2222-2222-2222-222222222004', '11111111-1111-1111-1111-111111111001', 
 'Shahi Beef Haleem (Khas Bowl)', 'شاہی بیف حلیم', 'Slow-cooked whole wheat, pulses, and shredded beef with fried onions & ginger.', 'per_plate_daigh', 380.00, NULL, NULL, TRUE, 30, 5.0, TRUE),

-- Tandoor & Chai:
('44444444-4444-4444-4444-444444444009', '22222222-2222-2222-2222-222222222005', '11111111-1111-1111-1111-111111111004', 
 'Roghni Naan', 'روغنی نان', 'Hot fluffy tandoori naan brushed with pure ghee and sesame seeds.', 'fixed', 90.00, NULL, NULL, FALSE, 0, 10.0, FALSE),

('44444444-4444-4444-4444-444444444010', '22222222-2222-2222-2222-222222222006', '11111111-1111-1111-1111-111111111005', 
 'Doodh Patti Karak Chai', 'دودھ پتی کڑک چائے', 'Slow-brewed thick tea brewed in pure milk.', 'fixed', 140.00, NULL, NULL, FALSE, 0, 10.0, FALSE),

('44444444-4444-4444-4444-444444444011', '22222222-2222-2222-2222-222222222003', '11111111-1111-1111-1111-111111111003',
 'Karachi Zinger Burger', 'زنگر برگر اسپیشل', 'Crispy jumbo spiced chicken fillet, ice-berg lettuce, chipotle mayo.', 'fixed', 550.00, NULL, NULL, FALSE, 0, 10.0, FALSE),

('44444444-4444-4444-4444-444444444012', '22222222-2222-2222-2222-222222222002', '11111111-1111-1111-1111-111111111002',
 'Peshawari Chapli Kabab', 'پشاوری چپلی کباب', 'Authentic spiced beef minced patty with pomegranate anardana and fresh tomato slice, fried in animal fat.', 'fixed', 480.00, NULL, NULL, FALSE, 0, 8.0, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 5. RECIPE INGREDIENTS (Bill of Materials)
INSERT INTO recipe_ingredients (menu_item_id, raw_inventory_item_id, quantity_required, is_proportional_to_weight, notes) VALUES
-- Chicken Shinwari Karahi (per kg: 1.05 kg chicken + 0.12 kg ghee + 0.35 kg tomato sauce per 1 kg cooked)
('44444444-4444-4444-4444-444444444001', '33333333-3333-3333-3333-333333333001', 1.0500, TRUE, 'Scaled by weighed kg'),
('44444444-4444-4444-4444-444444444001', '33333333-3333-3333-3333-333333333005', 0.1200, TRUE, 'Cooking fat per kg'),
('44444444-4444-4444-4444-444444444001', '33333333-3333-3333-3333-333333333006', 0.3500, TRUE, 'Fresh tomato paste per kg'),

-- Mutton Koyla Karahi (per kg: 1.08 kg mutton + 0.15 kg ghee)
('44444444-4444-4444-4444-444444444002', '33333333-3333-3333-3333-333333333002', 1.0800, TRUE, 'Fresh mutton per kg'),
('44444444-4444-4444-4444-444444444002', '33333333-3333-3333-3333-333333333005', 0.1500, TRUE, 'Ghee per kg'),

-- Fried Surmai Fish (per kg: 1.00 kg fish + 0.08 litre oil)
('44444444-4444-4444-4444-444444444003', '33333333-3333-3333-3333-333333333003', 1.0000, TRUE, 'Surmai cuts weighed'),
('44444444-4444-4444-4444-444444444003', '33333333-3333-3333-3333-333333333005', 0.0800, TRUE, 'Frying oil absorption'),

-- Quarter Broast (fixed: 0.280 kg chicken + 0.06 litre oil + 1 box)
('44444444-4444-4444-4444-444444444004', '33333333-3333-3333-3333-333333333001', 0.2800, FALSE, 'Quarter chicken cut'),
('44444444-4444-4444-4444-444444444004', '33333333-3333-3333-3333-333333333005', 0.0600, FALSE, 'Fryer oil consumption'),
('44444444-4444-4444-4444-444444444004', '33333333-3333-3333-3333-333333333008', 1.0000, FALSE, 'Takeaway broast box'),

-- Beef Bihari Kabab (fixed: 0.220 kg beef)
('44444444-4444-4444-4444-444444444005', '33333333-3333-3333-3333-333333333004', 0.2200, FALSE, 'Marinated beef pasanda'),

-- Daigh portions:
('44444444-4444-4444-4444-444444444007', '33333333-3333-3333-3333-333333333009', 1.0000, FALSE, '1 plate from current Biryani Daigh'),
('44444444-4444-4444-4444-444444444008', '33333333-3333-3333-3333-333333333010', 1.0000, FALSE, '1 plate from current Haleem Daigh'),

-- Roghni Naan:
('44444444-4444-4444-4444-444444444009', '33333333-3333-3333-3333-333333333007', 0.1600, FALSE, 'Dough ball per naan'),

-- Karak Chai:
('44444444-4444-4444-4444-444444444010', '33333333-3333-3333-3333-333333333011', 0.2000, FALSE, 'Fresh buffalo milk'),

-- Zinger Burger (0.22 kg chicken + 1 box):
('44444444-4444-4444-4444-444444444011', '33333333-3333-3333-3333-333333333001', 0.2200, FALSE, 'Crispy chicken fillet'),
('44444444-4444-4444-4444-444444444011', '33333333-3333-3333-3333-333333333008', 1.0000, FALSE, 'Burger box'),

-- Peshawari Chapli Kabab (0.25 kg beef + 0.04 L ghee):
('44444444-4444-4444-4444-444444444012', '33333333-3333-3333-3333-333333333004', 0.2500, FALSE, 'Beef minced pasanda'),
('44444444-4444-4444-4444-444444444012', '33333333-3333-3333-3333-333333333005', 0.0400, FALSE, 'Frying fat')
ON CONFLICT (menu_item_id, raw_inventory_item_id) DO NOTHING;

-- 6. RIDERS (Karachi Delivery Fleet)
INSERT INTO riders (id, full_name, phone, cnic, vehicle_number, status, total_deliveries) VALUES
('55555555-5555-5555-5555-555555555001', 'Muhammad Bilal Khan', '0300-8291024', '42101-9284719-1', 'KHI-9921', 'available', 142),
('55555555-5555-5555-5555-555555555002', 'Hamza Farooq', '0312-4820194', '42201-1928401-3', 'KHI-4412', 'available', 89),
('55555555-5555-5555-5555-555555555003', 'Zeeshan Ali', '0333-5182940', '42301-8172948-5', 'KHI-7810', 'on_delivery', 215)
ON CONFLICT (phone) DO NOTHING;

-- 7. MANAGER CREDENTIALS (for Anti-Theft Void Guard)
-- SHA-256 for '7860': 158e72750e4be68bc2cb8592955cf4df0e1011dd592751ecba01c0c6606a445e
-- SHA-256 for '1234': 03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4
INSERT INTO manager_credentials (id, manager_name, pin_hash, plain_pin_hint, role) VALUES
('66666666-6666-6666-6666-666666666001', 'Shahmeer Khan (General Manager)', '158e72750e4be68bc2cb8592955cf4df0e1011dd592751ecba01c0c6606a445e', '7860', 'general_manager'),
('66666666-6666-6666-6666-666666666002', 'Tariq Mehmood (Shift Supervisor)', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '1234', 'shift_supervisor')
ON CONFLICT (id) DO NOTHING;

-- 8. CASH DRAWER SESSION (Active Evening Shift)
INSERT INTO cash_drawer_sessions (id, cashier_name, cashier_id, terminal_id, opening_time, opening_cash, status) VALUES
('77777777-7777-7777-7777-777777777001', 'Asad Ullah (Cashier 1)', 'CASHIER-01', 'POS-01', NOW() - INTERVAL '3 hours', 5000.00, 'open')
ON CONFLICT (id) DO NOTHING;

-- 9. INITIAL ACTIVE SAMPLE ORDERS (Sent to Kitchen & Ready)
INSERT INTO orders (id, order_number, order_token, order_type, table_number, session_id, status, token_generated, bill_printed, subtotal, tax_srb, total_amount, payment_method, payment_status, customer_name, customer_phone) VALUES
('88888888-8888-8888-8888-888888888001', 101, 'TKN-101', 'dine_in', 'Table T-04', '77777777-7777-7777-7777-777777777001', 'sent_to_kitchen', TRUE, FALSE, 2530.00, 0.00, 2530.00, 'cash', 'paid', 'Kamran Sheikh', '0300-1234567'),
('88888888-8888-8888-8888-888888888002', 102, 'TKN-102', 'takeaway', NULL, '77777777-7777-7777-7777-777777777001', 'preparing', TRUE, TRUE, 1360.00, 0.00, 1360.00, 'cash', 'paid', 'Dr. Farhan', '0321-9876543')
ON CONFLICT (order_token) DO NOTHING;

-- Items for Order 101: 1.00 kg Shinwari Chicken Karahi (per kg) + 2 Roghni Naan + 2 Chai
INSERT INTO order_items (id, order_id, menu_item_id, kitchen_station_id, quantity, weight_kg, unit_price, total_price, item_status, special_instructions) VALUES
('99999999-9999-9999-9999-999999999001', '88888888-8888-8888-8888-888888888001', '44444444-4444-4444-4444-444444444001', '11111111-1111-1111-1111-111111111001', 1, 1.000, 1850.00, 1850.00, 'cooking', 'Extra green chilies, highway style'),
('99999999-9999-9999-9999-999999999002', '88888888-8888-8888-8888-888888888001', '44444444-4444-4444-4444-444444444009', '11111111-1111-1111-1111-111111111004', 2, NULL, 90.00, 180.00, 'queued', 'Crispy sesame'),
('99999999-9999-9999-9999-999999999003', '88888888-8888-8888-8888-888888888001', '44444444-4444-4444-4444-444444444010', '11111111-1111-1111-1111-111111111005', 2, NULL, 140.00, 280.00, 'queued', 'Kadak with less sugar')
ON CONFLICT (id) DO NOTHING;

-- Items for Order 102: 2 Quarter Chicken Broast
INSERT INTO order_items (id, order_id, menu_item_id, kitchen_station_id, quantity, weight_kg, unit_price, total_price, item_status, special_instructions) VALUES
('99999999-9999-9999-9999-999999999004', '88888888-8888-8888-8888-888888888002', '44444444-4444-4444-4444-444444444004', '11111111-1111-1111-1111-111111111003', 2, NULL, 680.00, 1360.00, 'cooking', 'Extra garlic dip sachets')
ON CONFLICT (id) DO NOTHING;
